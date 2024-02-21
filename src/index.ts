// import server from "bunrest";
import express from 'express';
import cors from 'cors';
import env from './env'
import { BigNumber, constants } from 'ethers'
import { config as utilConfig } from '@cyberbrokers/eth-utils';
utilConfig.setConfig({
  alchemy:{
    eth_key:env.ALCHEMY_KEY,
  }
})
import { contractAddresses } from "./libs/constants";
import { isValidSignatureForStringBody, provider } from "./libs/alchemy";
import { alchemyNotifyResponse } from "./types/alchemy";
import { webHookManagerEth, webHookManagerGoerli } from './managers'
import { Contract } from "ethers";
import { heapStats } from "bun:jsc";
import { Network } from "alchemy-sdk";
import { OwnersData, upsertAndComputeOwnersOfNFTs } from "./libs/pg/queries";
import { getABIbyAddressAndChainId, getBalanceOfERC1155Contract } from "./helpers/eth";
import { LogDescription } from "ethers/lib/utils";
import APIRouter from "./api";

const app = express();
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(cors({
  exposedHeaders: ['*', 'x-paradigm-secret'],
  allowedHeaders: ['*', 'x-paradigm-secret'],
}));

const currentlyProcessingHash = new Map()

for (const [_chain, contractsByChain] of Object.entries(contractAddresses)) {
  const chain = _chain as 'eth' | 'goerli'
  const addresses = Object.values(contractsByChain)
  for (const contractAddress of addresses) {
    // create a route for each contracts;
    app.post(`/hook/${chain}/` + contractAddress.toLowerCase(), async (req, res) => {
      const webHookManager = chain == 'eth' ? webHookManagerEth : webHookManagerGoerli
      await webHookManager.isReady()

      const address = contractAddress.toLowerCase()
      // verify it's a webhook request from alchemy
      const xAlchemyHeader = req.headers ? req.headers['x-alchemy-signature'] as string : undefined;
      if (!xAlchemyHeader) {
        return res.status(400).send('bad request');
      }
      const keyFromAddress = webHookManager.getKeyFromAddress(address)
      if (isValidSignatureForStringBody(xAlchemyHeader, keyFromAddress!)) {
        return res.status(400).send('bad request');
      }
      // sweet, we have a hook event from alchemy
      const body = req.body as alchemyNotifyResponse;

      // console.log(body.event.data.block.logs[0])
      const logs = body.event.data.block.logs
      if (!logs || logs.length === 0) {
        //@ts-ignore
        body.event = null;
        return res.status(200).send('ok');
      }
      // get hashes
      const hashes = (logs.map((l) => l.transaction.hash)).filter((v, i, a) => a.indexOf(v) === i)
      // if hash is being processed, ignore;
      if (hashes.some((hash) => currentlyProcessingHash.has(hash))) {
        console.log('hash already being processed')
        return res.status(200).send('ok');
      }
      // hashes aren't present, add them to list of hashes;
      for (const hash of hashes) {
        currentlyProcessingHash.set(hash, true)
      }
      // get corresponding ABI
      const isMechContract = address == contractAddresses[chain]["genesis-mechs"].toLowerCase()

      console.log(`[${chain}] contract: ` + Object.entries(contractAddresses[chain]).find((t) => t[1].toLowerCase() == address.toLowerCase())?.[0], ', address:' + address)

      const newOwnerShipDetails: OwnersData[] = []
      const checkIfPresentInMap = (address: string, tokenId: number, owner: string, count: number) => {
        let old = newOwnerShipDetails.find((t) => t.address == address && t.tokenId == tokenId && t.owner == owner)
        if (old) {
          console.warn('Duplicate entry for ' + address + ' ' + tokenId + ' ' + owner + '; new count:' + count + `; old count:` + old.count)
          return false
        }
        return true
      }
      for (const log of logs) {
        for (const innerLog of log.transaction.logs) {
          let object = {
            data: innerLog.data || '',
            topics: innerLog.topics,
          }
          const actualContractAddress = innerLog.account.address
          const ABI = getABIbyAddressAndChainId(actualContractAddress, chain)
          let contract = new Contract(actualContractAddress, ABI, provider)
          let decoded: LogDescription = {} as any
          try {
            decoded = contract.interface.parseLog(object)
          } catch { }
          if (!decoded?.name) {
            console.warn('Could not decode event' + JSON.stringify(object))
            continue;
          }
          const eventName = decoded.name
          console.log('EventName: ' + eventName)

          const transferEvents = ['Transfer', 'TransferSingle', 'TransferBatch']
          if (!transferEvents.includes(eventName)) {
            continue;
          }

          if (eventName == 'Transfer') {
            // ERC721
            const [from, to, token_id] = decoded.args as [string, string, BigNumber]
            const isMint = from == constants.AddressZero
            const isBurned = to == constants.AddressZero
            console.log(`Transfer from ${from} to ${to} tokenId ${token_id.toNumber()}`)
            if (!isBurned && checkIfPresentInMap(actualContractAddress, token_id.toNumber(), to, 1)) {
              newOwnerShipDetails.push({ address: actualContractAddress, owner: to, tokenId: token_id.toNumber(), count: 1 })
            }
            // Dont save ownership of address Zero;
            if (!isMint && checkIfPresentInMap(actualContractAddress, token_id.toNumber(), from, 1)) {
              newOwnerShipDetails.push({ address: actualContractAddress, owner: from, tokenId: token_id.toNumber(), count: 0 })
            }
          } else if (eventName == 'TransferSingle') {
            // ERC1155
            const [operator, from, to, token_id, value] = decoded.args as [string, string, string, BigNumber, BigNumber]
            const isMint = from == constants.AddressZero
            const isBurned = to == constants.AddressZero

            console.log(`Transfer from ${from} to ${to} tokenId ${token_id.toNumber()}, count: ${value.toNumber()}`)
            // We could do the math here, but it's safer to just ask the blockchain what the final value is;
            if (!isBurned) {
              const toBalance = await getBalanceOfERC1155Contract(contract, to, token_id.toNumber())
              if (toBalance != 'error' && checkIfPresentInMap(actualContractAddress, token_id.toNumber(), to, toBalance)) {
                newOwnerShipDetails.push({ address: actualContractAddress, owner: to, tokenId: token_id.toNumber(), count: toBalance })
              }
            }

            if (!isMint) {
              // Dont save ownership of address Zero;
              const fromBalance = await getBalanceOfERC1155Contract(contract, from, token_id.toNumber())
              if (fromBalance != 'error' && checkIfPresentInMap(actualContractAddress, token_id.toNumber(), from, fromBalance)) {
                newOwnerShipDetails.push({ address: actualContractAddress, owner: from, tokenId: token_id.toNumber(), count: fromBalance })
              }
            }


          } else if (eventName == 'TransferBatch') {
            // ERC1155 transferBatch
            const [operator, from, to, token_ids, values] = decoded.args as [string, string, string, BigNumber[], BigNumber[]]
            const isMint = from == constants.AddressZero
            const isBurned = to == constants.AddressZero

            for (let i = 0; i < token_ids.length; i++) {
              const id = token_ids[i].toNumber()
              if (!isMint) {
                const fromBalance = await getBalanceOfERC1155Contract(contract, from, id)
                if (fromBalance != 'error') {
                  newOwnerShipDetails.push({ address: actualContractAddress, owner: from, tokenId: id, count: fromBalance })
                }
              }

              if (!isBurned) {
                const toBalance = await getBalanceOfERC1155Contract(contract, to, id)
                if (toBalance != 'error') {
                  newOwnerShipDetails.push({ address: actualContractAddress, owner: to, tokenId: id, count: toBalance })
                }
              }

            }
          }
          contract = null!
        }
      }
      console.log('Saving to DB now...')
      // save to DB
      await upsertAndComputeOwnersOfNFTs(chain == 'goerli' ? Network.ETH_GOERLI : Network.ETH_MAINNET, newOwnerShipDetails)

      for (const hash of hashes) {
        currentlyProcessingHash.delete(hash)
      }

      return res.status(200).send('ok');
    });
  }
}

// app.use(bodyParser)


app.get('/', (req, res) => {
  res.status(200).send('ok');
});


APIRouter(app)


app._router.stack.forEach(function (r: any) {
  if (r.route && r.route.path) {
    console.log(r.route.path)
  }
})

app.listen(env.SERVER_PORT, () => {
  console.log('Server listening on port ' + env.SERVER_PORT)
})


setTimeout(async () => {
  // Run job to sync ownership on startup
  // await setCurrentOwnership(Network.ETH_MAINNET)
  // await setCurrentOwnership(Network.ETH_GOERLI)
}, 2000)

setInterval(async () => {
  console.log('memoryHeap: ' + heapStats().heapSize / 1024 / 1024 + 'mb')
}, 30000)
