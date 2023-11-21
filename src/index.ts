import server from "bunrest";
const app = server();
const bodyParser = require('body-parser')
import env from './env'
import {constants} from 'ethers'
import { contractAddresses, mintContractAddresses } from "./libs/constants";
import { isValidSignatureForStringBody, provider } from "./libs/alchemy";
import { alchemyNotifyResponse } from "./types/alchemy";
import {webHookManagerEth,webHookManagerGoerli} from './libs/webhookManager'
import { Contract } from "ethers";
import { ABIS } from "@cyberbrokers/eth-utils";
import { setCurrentOwnership } from "./jobs/setCurrentOwnership";
import { Network } from "alchemy-sdk";
/**
 * Webhooks; It's important to create them BEFORE we use the json() middleware
 */
for(const [_chain,contractsByChain] of Object.entries(contractAddresses)){
  const chain = _chain as 'eth'|'goerli'
  const addresses =Object.values(contractsByChain)
  for(const contractAddress of addresses){
    // create a route for each contracts;
    app.post(`/hook/${chain}/`+contractAddress.toLowerCase(), async (req, res) => {
      const webHookManager= chain=='eth'?webHookManagerEth:webHookManagerGoerli
      await webHookManager.isReady()

      const address = contractAddress.toLowerCase()
      // verify it's a webhook request from alchemy
      const xAlchemyHeader = req.headers?req.headers['x-alchemy-signature']:undefined;
      if(!xAlchemyHeader){
        res.status(400).send('bad request');
        return;
      }
      const keyFromAddress = webHookManager.getKeyFromAddress(address)
      if(isValidSignatureForStringBody(req.body as string,xAlchemyHeader,keyFromAddress!)){
        res.status(400).send('bad request');
        return;
      }
      // sweet, we have a hook event from alchemy
      const body = req.body as alchemyNotifyResponse;


      // get corresponding ABI
      const isMechContract = address == contractAddresses[chain]["genesis-mechs"].toLowerCase()

      let ABI = ABIS.mechAssemblerAbi as any[];
      switch (address) {
        case contractAddresses[chain]["genesis-mechs"].toLowerCase():{
          ABI = ABIS.mechAbi;
          break;}
        case contractAddresses[chain].cyberbrokers.toLowerCase():{
          ABI = ABIS.cyberbrokersAbi;
          break;}
        case contractAddresses[chain].afterglow.toLowerCase():{
          ABI = ABIS.afterglowAbi;
          break;}
        case contractAddresses[chain].accolades.toLowerCase():{
          ABI = ABIS.accoladeAbi;
          break;}
        case contractAddresses[chain]["unrevealed-mech-parts"].toLowerCase():{
          ABI = ABIS.unrevealedAbi;
          break;}
        case contractAddresses[chain]["revealed-mech-parts"].toLowerCase():{
          ABI = ABIS.revealedAbi;
          break;}
        default:
          break;
      }

      console.log(body.event.data.block.logs[0])
      const logs = body.event.data.block.logs

      if(!logs || logs.length === 0){
        return res.status(200).send('ok');
      }
      console.log(`[${chain}] contract: `+ Object.entries(contractAddresses[chain]).find((t)=>t[1].toLowerCase() == address.toLowerCase())?.[0],', address:'+address)

      const contract = new Contract(contractAddress,ABI,provider)

      for (const log of logs){
        const fromAddress = log.transaction.from.address
        const toAddress = log.transaction.to.address

        // special stuff for the mech contract when minting / burning
        const mintAddress = isMechContract?mintContractAddresses.mechs:constants.AddressZero
        const burnAddress = isMechContract?mintContractAddresses.mechs:constants.AddressZero

        if(fromAddress==mintAddress){
          // do something if minted?
        }else if(burnAddress==toAddress){
          // do something if burned?

        }
        for (const innerLog of log.transaction.logs){
          console.log(innerLog)
          let object = {
            data:innerLog.data||'',
            topics:innerLog.topics,
          }
          const decoded = contract.interface.parseLog(object)
          console.log(decoded)
          const functionName = contract.interface.getFunction(innerLog.topics[0])
          console.log(`[${chain}] functionName: `+functionName)
        }
      }

      res.status(200).send('ok');
    });
  }
}

app.use(bodyParser)


app.get('/', (req, res) => {
  res.status(200).send('ok');
});


app.listen(env.SERVER_PORT,()=>{
  console.log('Server listening on port '+ env.SERVER_PORT)
})


setTimeout(async ()=>{
  // Run job to sync ownership on startup
  await setCurrentOwnership(Network.ETH_MAINNET)
  await setCurrentOwnership(Network.ETH_GOERLI)
},2000)