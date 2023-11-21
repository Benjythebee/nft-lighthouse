import { Network } from "alchemy-sdk"
import {pg} from "./pg"

export type OwnersData={
    address:string, owner:string, tokenId:number, count?:number
}
export type EncodedOwnersData={
    address:Buffer, owner:Buffer, tokenId:number, count?:number
}
export const upsertOwnersOfNFTs = async (chain:Network,ownersData:OwnersData[]) => {

    const byAddresses:Record<string,OwnersData[]> = {}
    for(const ownerData of ownersData){
        if(!byAddresses[ownerData.address]){
            byAddresses[ownerData.address] = []
        }
        byAddresses[ownerData.address].push(ownerData)
    }

    for(const [address,values] of Object.entries(byAddresses)){
        try{
            await pg.query(`WITH contract_ids AS (
                SELECT c.contract_id
                FROM contract c
                WHERE c.blockchain = '${chain}' AND c.address = decode('${address.substring(2)}','hex')
            ),
            new_values (token_id, owner, count) AS (
                VALUES
                ${values.map((ownerData)=>{
                    return `(${ownerData.tokenId}, decode('${ownerData.owner.substring(2)}','hex'), ${ownerData.count})`
                }).join(', ')}
            )
        
            INSERT INTO token_ownership (contract_id, token_id, owner, count, updated_at)
            SELECT c.contract_id, v.token_id, v.owner, v.count, NOW()
            FROM contract_ids c
            CROSS JOIN new_values v
            ON CONFLICT (contract_id, token_id, owner)
            DO UPDATE SET
                count = EXCLUDED.count,
                updated_at = NOW();`)
        }catch(e:any){
            console.error(e)
            return false
        }
    }
    console.log('Upserted for '+ Object.keys(byAddresses).join(', '))
        
  
    return true
}