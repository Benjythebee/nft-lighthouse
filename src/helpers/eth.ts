import { ABIS } from "@cyberbrokers/eth-utils";
import { contractAddresses } from "../libs/constants";
import { Contract } from "ethers";

export const getABIbyAddressAndChainId = (address:string,chain:'eth'|'goerli') => {
    
    let ABI = ABIS.mechAbi as any[];
    switch (address) {
      case contractAddresses[chain]["genesis-mechs"].toLowerCase():
        ABI = ABIS.mechAbi;
        break;
      case contractAddresses[chain].cyberbrokers.toLowerCase():
        ABI = ABIS.cyberbrokersAbi;
        break;
      case contractAddresses[chain].afterglow.toLowerCase():
        ABI = ABIS.afterglowAbi;
        break;
      case contractAddresses[chain].accolades.toLowerCase():
        ABI = ABIS.accoladeAbi;
        break;
      case contractAddresses[chain]["unrevealed-mech-parts"].toLowerCase():
        ABI = ABIS.unrevealedAbi;
        break;
      case contractAddresses[chain]["revealed-mech-parts"].toLowerCase():
        ABI = ABIS.revealedAbi;
        break;
      default:
        break;
    }
    return ABI
}


export const getBalanceOfERC1155Contract= async (contract:Contract,owner:string,tokenId:number) :Promise<number|'error'>=> {
  try{
    let q = await contract.balanceOf(owner,tokenId)
    return q.toNumber()
  }catch{
    return 'error'
  }
}
