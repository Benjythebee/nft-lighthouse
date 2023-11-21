import {utils} from 'ethers'
import {ABIS, getCbContractsByChainId} from '@cyberbrokers/eth-utils'
import { getOwnerForCollectionResponse, ownerWithBalance, ownerWithBalanceWithContract } from '../types/alchemy-api'
import env from '../env'
import { Network } from 'alchemy-sdk'


export const mechInterface = new utils.Interface(ABIS.mechAbi)
export const mechCraftInterface = new utils.Interface(ABIS.mechAssemblerAbi)

export const getOwnersAndBalancesOfNFT = async (address:string) => {
    let url = `https://eth-mainnet.g.alchemy.com/nft/v2/${env.ALCHEMY_KEY}/getOwnersForCollection`
  
    url += `?contractAddress=${address}&withTokenBalances=true`

    let pageKey =''
    let ownersWithBalances:ownerWithBalance[] = []
    const fetchApi = async ()=>{

        let fetchUrl = url + (pageKey?`&pageKey=${pageKey}`:'')

        try {
            let p = await fetch(fetchUrl, { method: 'GET'})
            let response = (await p.json()) as getOwnerForCollectionResponse
            ownersWithBalances.push(...(response?.ownerAddresses||[]))
            if(response.pageKey){
                pageKey = response.pageKey
                await fetchApi()
            }
          } catch(e:any){
              console.error(e)
            return []
          }
          
    }
    await fetchApi()
    return (ownersWithBalances as ownerWithBalanceWithContract[]).map((o)=>{o.contract = address; return o}) as ownerWithBalanceWithContract[]
  }
  

export default async function getOwnershipOfAllNFTs(chain:Network=Network.ETH_MAINNET){
    const chainId = chain==Network.ETH_GOERLI?5:1
    let mechAddress = getCbContractsByChainId(chainId).mechAddress
    let cyberBrokersAddress = getCbContractsByChainId(chainId).cyberBrokersAddress
    let afterGlowAddress = getCbContractsByChainId(chainId).afterGlowAddress
    let revealedAddress = getCbContractsByChainId(chainId).revealedAddress
    let unrevealed = getCbContractsByChainId(chainId).unrevealedAddress
    let [mechOwners,cyberBrokersOwners,afterglowOwners] = await Promise.all([
        getOwnersAndBalancesOfNFT(mechAddress),
        getOwnersAndBalancesOfNFT(cyberBrokersAddress),
        getOwnersAndBalancesOfNFT(afterGlowAddress),
     ]) 
     let [revealedOwners,unrevealedOwners] = await Promise.all([
        getOwnersAndBalancesOfNFT(revealedAddress),
        getOwnersAndBalancesOfNFT(unrevealed),
     ]) 
    return {mechOwners,cyberBrokersOwners,afterglowOwners,revealedOwners,unrevealedOwners}
}