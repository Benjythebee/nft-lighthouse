import server from "bunrest";
const app = server();
const bodyParser = require('body-parser')
import env from './env'
import {constants} from 'ethers'
import { contractAddresses, mintContractAddresses } from "./libs/constants";
import { isValidSignatureForStringBody, provider } from "./libs/alchemy";
import { alchemyNotifyResponse } from "./types/alchemy";
import {webHookManager} from './libs/webhookManager'
import { Contract } from "ethers";
import { ABIS } from "@cyberbrokers/eth-utils";
import { objectEnumNames } from "@prisma/client/runtime/library";
import { setCurrentOwnership } from "./jobs/setCurrentOwnership";
/**
 * Webhooks; It's important to create them BEFORE we use the json() middleware
 */
for(const contractAddress of Object.values(contractAddresses)){
  // create a route for each contracts;
  app.post('/hook/'+contractAddress.toLowerCase(), async (req, res) => {
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


    const isMechContract = address == contractAddresses.mechs.toLowerCase()
    const isMechModsContract = false //address == contractAddresses.mechMods.toLowerCase()
    const isCyberbrokersContract = address == contractAddresses.cyberbrokers.toLowerCase()
    // const isYogaPets = address == contractAddresses.yogapets.toLowerCase()
    console.log('contract: '+ Object.entries(contractAddresses).find((t)=>t[1].toLowerCase() == address.toLowerCase())?.[0],', address:'+address)
    let ABI = ABIS.mechAssemblerAbi;
    if(isCyberbrokersContract){
      ABI = ABIS.cyberbrokersAbi
    }


    console.log(body.event.data.block.logs[0])
    const logs = body.event.data.block.logs

    if(!logs || logs.length === 0){
      return res.status(200).send('ok');
    }

    const contract = new Contract(contractAddress,ABI,provider)
    console.log('contract:',contract.address)

    for (const log of logs){
      const fromAddress = log.transaction.from.address
      const toAddress = log.transaction.to.address

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
        console.log('functionName:',functionName)
      }
    }

    res.status(200).send('ok');
  });
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
  await setCurrentOwnership()
},2000)