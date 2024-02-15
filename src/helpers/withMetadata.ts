import { getMetadataForNFTs } from "@cyberbrokers/eth-utils"
import { pg } from "../libs/pg/pg"
import { OwnerData, OwnerDataWithMetadata, onchain_asset_metadata_cache } from "../types/api"

export const withMetadata = async (nfts: OwnerData[]): Promise<OwnerDataWithMetadata[]> => {
  if(nfts.length == 0) return []
  
    const sortedByContract:Record<string,any> = {}
    nfts.forEach((nft) => {
      if (!sortedByContract[nft.contract_address + ':' + nft.blockchain]) {
        sortedByContract[nft.contract_address + ':' + nft.blockchain] = []
      }
      sortedByContract[nft.contract_address + ':' + nft.blockchain].push(nft.token_id)
    })


    const result:OwnerDataWithMetadata[] = []

    /**
     * Step one: Get metadata from Database first;
     * If metadata doesn't exist, get from CDN and save it to DB;
    */
    for (const _contract in sortedByContract) {
      const contractAddress = _contract.split(':')[0]
      const chain = _contract.split(':')[1] as "eth-mainnet" | "eth-goerli"
      const listOfTokenIds = sortedByContract[_contract] as string[]
      
      // get contract id;

      console.log(contractAddress.substring(2))
      const nftsFromDB = await pg.query(`SELECT t.*
      FROM onchain_asset_metadata_cache t 
      JOIN contract c 
      ON t.contract_id = c.contract_id 
      WHERE c.address = decode($1,'hex')
      AND t.token_id IN ('${listOfTokenIds.join(`', '`)}') AND c.blockchain = $2`, [contractAddress.substring(2), chain])

      const rows = (nftsFromDB?.rows?.length? nftsFromDB.rows : []) as onchain_asset_metadata_cache[]
      
      // get all missing NFTs Metadata from the CDN (or where metadata is empty)
      const missingNFTs = listOfTokenIds.filter((tokenId) => !rows.find((row) => row.token_id == BigInt(tokenId)) || !rows.find((row) => Object.keys(row.metadata).length == 0))
      
      // if we have missing NFTs, start the process of creating new metadata cache;
      if(missingNFTs.length){
        // First we need to get the contract_id from the DB;
        let contract_id = rows[0]?.contract_id

        if(!contract_id){
          // if we have no contract_id, it can also mean that rows.length = 0
          const contract = await pg.query(`SELECT * FROM contract WHERE address = decode($1,'hex') AND blockchain = $2`, [contractAddress.substring(2), chain])
          if(!contract?.rows?.length){
            // we have no contract, skip
            continue
          }
          contract_id = contract.rows[0].contract_id
        }
        
        const chainId = chain == "eth-mainnet" ? 1 : 5
        // get the metadata from the CDN;
        const metadata = (await getMetadataForNFTs(contractAddress, missingNFTs, chainId)) as {
          tokenId: number
          name: string
          description: string
          image: string
          attributes: any
        }[]

        const newMetadataCacheRecords:OwnerDataWithMetadata[] = []
        for (const meta of metadata) {
          
          if (!meta.tokenId && !meta.image) {
            // we have no image or tokenId, skip
            continue
          }

          const metadata_cache:Partial<onchain_asset_metadata_cache> = {
            contract_id,
            token_id:BigInt(meta.tokenId),
            metadata:meta
          }

          // Save to the DB
          const record = await pg.query(`INSERT INTO onchain_asset_metadata_cache 
          (contract_id, token_id, metadata) 
            VALUES ($1, $2, $3) 
            ON CONFLICT 
            (contract_id, token_id) DO UPDATE SET metadata = EXCLUDED.metadata RETURNING *`, [contract_id, BigInt(meta.tokenId), metadata_cache.metadata])
            if(record?.rows?.length){
              newMetadataCacheRecords.push(record.rows[0])
            }
        }
        result.push(...newMetadataCacheRecords.map((record)=>({
          ...nfts.find((nft)=>nft.token_id == Number(record.token_id) && nft.contract_id == Number(record.contract_id))!,
          metadata:record.metadata
        })))
      }else{
        result.push(...rows.map((record)=>({
          ...nfts.find((nft)=>nft.token_id == Number(record.token_id) && nft.contract_id == Number(record.contract_id))!,
          metadata:record.metadata
        })))
      }
  }
  return result

  }
