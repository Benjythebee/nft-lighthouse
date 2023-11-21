export type transaction ={
    hash:string,
    index:number,
    from:{
        address:string
    },
    to:{
        address:string
    },
    maxFeePerGas:string,
    maxPriorityFeePerGas:string,
    gasUsed:number,
    cumulativeGasUsed:number,
    effectiveGasPrice:string,
    logs:{
        account:{
            address:string
        },
        topics:string[],
        index:number,
        data:string|null
    }[],
    type:number,
    status:number
}


export type customGraphQL = {
    fromAddress:string,
    toAddress:string,
    blockNum:string,
    category:'external'|'internal'|'token'|'erc1155',
    hash:string,
    value:number,
    erc721TokenId:string|null,
    erc1155Metadata:{tokenId:string,value:string}[]|null,
    typeTraceAddress:string|null,
    asset:string,
    log:ethLog|null|undefined
    rawContract:{
      rawValue:string,
      address:string,
      decimals:number
    }
  }
  
  export type alchemyNotifyResponse = {
    webhookId: string,
    id: string,
    createdAt: string,
    type: "GRAPHQL",
    event:{
        error?:string,
      network?:'MATIC_MAINNET'|'ETH_MAINNET'|'ETH_RINKEBY'|'MATIC_MUMBAI',
      data:{
        block:{
            logs:{transaction:transaction}[]
        }
      }
    }
  }
  
  type ethLog = {
    address:string,
    topics:string[]
    data:string,
    blockNumber:string,
    transactionHash:string,
    transactionIndex:string,
    blockHash:string,
    logIndex:string,
    removed:boolean
  }
  