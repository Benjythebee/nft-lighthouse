import { getCbContractsByChainId, parseTokenId } from "@cyberbrokers/eth-utils"
import getOwnershipOfAllNFTs from "../helpers/currentOwnership"
import { OwnersData, upsertOwnersOfNFTs } from "../libs/prisma/queries"
import { ownerWithBalanceWithContract } from "../types/alchemy-api"


export const setCurrentOwnership = async () => {
    let {mechOwners,cyberBrokersOwners,afterglowOwners,revealedOwners,unrevealedOwners} = await getOwnershipOfAllNFTs()

    // We have the owners, now we need to update the database
    const parsedResult = (result:ownerWithBalanceWithContract[])=>{
        let owners:OwnersData[] = []
        for(const owner of [...result]){
            for(let j = 0; j<owner.tokenBalances.length;j++){
                let tokenBalance = owner.tokenBalances[j]
                owners.push({address:owner.contract,owner:owner.ownerAddress,tokenId:parseInt(parseTokenId(tokenBalance.tokenId)),count:tokenBalance.balance})
            }
        }
        return owners
    }

    // let's do it one at a time cause we don't want to overload the db;
    let owners = parsedResult([...mechOwners,...cyberBrokersOwners])
    await upsertOwnersOfNFTs(owners)
    await sleep(500)
    owners=parsedResult([...afterglowOwners,...revealedOwners])
    await upsertOwnersOfNFTs(owners)
    await sleep(500)
    owners=parsedResult([...unrevealedOwners])
    await upsertOwnersOfNFTs(owners)
    
}

const sleep = (ms:number) => new Promise((resolve)=>setTimeout(resolve,ms))