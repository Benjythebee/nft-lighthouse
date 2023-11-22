import { Alchemy, CustomGraphqlWebhook, Network, WebhookType } from "alchemy-sdk";
import env from "../env";
import alchemy from './alchemy'
import {contractAddresses} from './constants'
import localtunnel from 'localtunnel'

export default class WebHookManager{
    webhooks:CustomGraphqlWebhook[]=[]
    _isReady:boolean=false
    _host:string = env.SERVER_HOST
    
    constructor(public alchemy:Alchemy,private addressesToListenTo:string[] = [],public network:Network=Network.ETH_MAINNET){
        this._init()
    }

    getKeyFromAddress(address:string){
        return this.webhooks.find((w)=>w.url.includes(address.toLowerCase()))?.signingKey
    }

    async isReady(){
        if(this._isReady){
            return true
        }
        return new Promise<boolean>((resolve,reject)=>{
            let i = setInterval(()=>{
                if(this._isReady && this.webhooks.length==this.addressesToListenTo.length){
                    console.log('Webhook manager is ready')
                    clearInterval(i)
                    resolve(true)
                }
            },500)
        })
    }

    private async setLocalTunnelIfNeeded(){
        if(env.SERVER_HOST!="localhost") return
        const tunnel = await localtunnel({ port: env.SERVER_PORT });

        // the assigned public url for your tunnel
        // i.e. https://abcdefgjhij.localtunnel.me
        this._host= tunnel.url;

        tunnel.on('close', () => {
        // tunnels are closed
        });
        return 
    }

    private async _init(){
        await this.setLocalTunnelIfNeeded()
        let webhooks = await this.getAllWebhooks()
        if(webhooks.length){
            webhooks.forEach((t)=>{
                !t.isActive && this.toggleWebhook(t,true)
            })
            this.webhooks = webhooks
        }

        if(this.webhooks.length < this.addressesToListenTo.length){
            await this.resetWebhooks()
        }
    }

    private get baseUrl(){
        return env.SERVER_HOST=="localhost"?this._host:`https://${env.SERVER_HOST}`
    }
    
    async getAllWebhooks(){

        const nftCustomWebhooks = await this.alchemy.notify.getAllWebhooks().catch((e)=>{console.error(JSON.stringify(e));console.log(e.stack);return {webhooks:[]}})
        let leftOverWebhooks = nftCustomWebhooks.webhooks
        // delete old localtunnel webhooks if any;
        if(env.SERVER_HOST=="localhost"){
          const localTunnelWebhooks = nftCustomWebhooks.webhooks.filter((t)=>t.type==WebhookType.GRAPHQL && t.url.includes('loca.lt') && t.url.includes(this.network==Network.ETH_GOERLI?'goerli/':'eth/'))
          await Promise.all(localTunnelWebhooks.map((t)=>this.deleteWebhook(t as CustomGraphqlWebhook)))
          // Now filter by hooks that aren't localtunnel
          leftOverWebhooks = nftCustomWebhooks.webhooks.filter((t)=>t.type==WebhookType.GRAPHQL && !t.url.includes('loca.lt'))
        }

        // Now filter by hooks that are the correct chain url
        const leftOverWebhooksWithCorrectChain = leftOverWebhooks.filter((t)=>t.url.includes(this.network==Network.ETH_GOERLI?'goerli/':'eth/'))

        // Only get hooks that are for this server
        return leftOverWebhooksWithCorrectChain.filter((t)=>t.type==WebhookType.GRAPHQL && t.url.startsWith(this.baseUrl)) as CustomGraphqlWebhook[]

    }

    async disableAllWebhooks(){
        await Promise.all(this.webhooks.map((t)=>this.toggleWebhook(t,false)))
    }
    async deleteAllWebhooks(){
        await Promise.all(this.webhooks.map((t)=>this.deleteWebhook(t)))
    }

    async createWebhook(address:string){
      console.log(`Creating ${this.network} webhook for ${address}`)
        const nftCustomWebhook = await this.alchemy.notify.createWebhook(
            `${this.baseUrl}/hook/${this.network==Network.ETH_GOERLI?'goerli/':'eth/'}${address.toLowerCase()}`,
            //@ts-ignore
            WebhookType.GRAPHQL,{
                skip_empty_messages:true,
                graphqlQuery:graphQLQueries.transferQuery(address),
                network:this.network
            }
          );
          this.webhooks.push(nftCustomWebhook)
        return nftCustomWebhook
    }

    private async resetWebhooks(){
        this._isReady = false
        await Promise.all(this.webhooks.map((w)=>this.deleteWebhook(w)))
        this.webhooks = []
        await Promise.all(this.addressesToListenTo.map((address)=>this.createWebhook(address))) 
        return this._isReady = true
    }

    async deleteWebhook(webhook:CustomGraphqlWebhook){
        try{
            await this.alchemy.notify.deleteWebhook(webhook);
            this.webhooks.splice(this.webhooks.indexOf(webhook),1)
        }catch(e:any){
            console.error(e)
            this.webhooks.push(webhook)
        }
        return 
    }

    async toggleWebhook(webhook:CustomGraphqlWebhook,enable:boolean){
        return await this.alchemy.notify.updateWebhook(webhook.id,{isActive:enable});
    }
}

export const webHookManagerEth = new WebHookManager(alchemy.alchemyEth,Object.values(contractAddresses.eth),Network.ETH_MAINNET)
export const webHookManagerGoerli = new WebHookManager(alchemy.alchemyGoerli,Object.values(contractAddresses.goerli),Network.ETH_GOERLI)

const graphQLQueries = {
    transferQuery:(address:string)=>`{
        block {
            number
          logs(filter: {addresses: ["${address}"], topics: []}) {
            transaction {
              hash
              index
              from {
                address
              }
              to {
                address
              }
              maxFeePerGas
              maxPriorityFeePerGas
              gasUsed
              cumulativeGasUsed
              effectiveGasPrice
              logs {
                account {
                  address
                }
                topics
                data
                index
              }
              type
              status
            }
          }
        }
      }`,
    exampleQuery:`{
        block {
            number
          logs(filter: {addresses: ["0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"], topics: []}) {
            transaction {
              hash
              index
              from {
                address
              }
              to {
                address
              }
              maxFeePerGas
              maxPriorityFeePerGas
              gasUsed
              cumulativeGasUsed
              effectiveGasPrice
              logs {
                account {
                  address
                }
                topics
                index
              }
              type
              status
            }
          }
        }
      }`
}