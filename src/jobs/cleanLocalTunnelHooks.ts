import WebHookManager from "../libs/webhookManager";
import alchemy from "../libs/alchemy";

WebHookManager.cleanAllLocaltunnelWebhooks(alchemy.alchemyEth).finally(()=>{
    console.log('Cleaned')
    process.exit(0)
})