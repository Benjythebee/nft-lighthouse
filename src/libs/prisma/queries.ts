import prisma from "./prisma"

export type OwnersData={
    address:string, owner:string, tokenId:number, count?:number
}
export type EncodedOwnersData={
    address:Buffer, owner:Buffer, tokenId:number, count?:number
}
export const upsertOwnersOfNFTs = async (ownersData:OwnersData[]) => {

    const byAddresses:Record<string,OwnersData[]> = {}
    for(const ownerData of ownersData){
        if(!byAddresses[ownerData.address]){
            byAddresses[ownerData.address] = []
        }
        byAddresses[ownerData.address].push(ownerData)
    }

    for(const [address,values] of Object.entries(byAddresses)){
        try{
            await prisma.$executeRawUnsafe(`WITH contract_ids AS (
                SELECT c.contract_id
                FROM contract c
                WHERE c.blockchain = 'eth-mainnet' AND c.address = decode('${address.substring(2)}','hex')
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
            console.log('upserted')
        }catch(e:any){
            console.error(e)
            return false
        }
    }
        
  
    return true
}