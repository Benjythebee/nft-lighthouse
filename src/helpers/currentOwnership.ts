import {utils} from 'ethers'
import {ABIS, getCbContractsByChainId} from '@cyberbrokers/eth-utils'
import { getOwnerForCollectionResponse, ownerWithBalance, ownerWithBalanceWithContract } from '../types/alchemy-api'
import env from '../env'


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
  

export default async function getOwnershipOfAllNFTs(){

    let mechAddress = getCbContractsByChainId(1).mechAddress
    let cyberBrokersAddress = getCbContractsByChainId(1).cyberBrokersAddress
    let afterGlowAddress = getCbContractsByChainId(1).afterGlowAddress
    let revealedAddress = getCbContractsByChainId(1).revealedAddress
    let unrevealed = getCbContractsByChainId(1).unrevealedAddress
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