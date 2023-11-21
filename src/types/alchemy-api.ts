export type ownerWithBalance = {
    ownerAddress: string
    tokenBalances: { tokenId: string; balance: number }[]
  }
export type ownerWithBalanceWithContract = {
  contract:string
  ownerAddress: string
  tokenBalances: { tokenId: string; balance: number }[]
}
  export type getOwnerForCollectionResponse = {
    ownerAddresses: ownerWithBalance[]
    pageKey?: string
  }
  