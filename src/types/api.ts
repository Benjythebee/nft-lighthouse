import { Network } from 'alchemy-sdk';

export type OwnerData = { owner: string, contract_address: string, blockchain: Network, token_id: number, contract_id: number, count:string, updated_at:Date, }
export type OwnerDataWithMetadata = OwnerData & { metadata:onchain_asset_metadata_cache['metadata'] }

export type onchain_asset_metadata_cache = {
    metadata_cache_id:bigint
    contract_id:bigint
    token_id:bigint
    metadata:Record<string,any>
}