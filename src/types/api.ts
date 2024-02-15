import { Network } from 'alchemy-sdk';

export type OwnerData = { owner: string, contract_address: string, blockchain: Network, token_id: number, contract_id: number }
export type OwnerDataWithMetadata = { owner: string, contract_address: string, blockchain: Network, token_id: number, contract_id: number, metadata:onchain_asset_metadata_cache['metadata'] }

export type onchain_asset_metadata_cache = {
    metadata_cache_id:bigint
    contract_id:bigint
    token_id:bigint
    metadata:Record<string,any>
}