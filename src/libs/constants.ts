import {getCbContractsByChainId} from '@cyberbrokers/eth-utils'

export const contractAddresses = {
    mechs:getCbContractsByChainId(1).mechAddress,
    // mechsGoerli:getCbContractsByChainId(5).mechAddress,
    cyberbrokers:getCbContractsByChainId(1).cyberBrokersAddress,
}

export const mintContractAddresses ={
    mechs:getCbContractsByChainId(1).mechCrafter,
    mechsGoerli:getCbContractsByChainId(5).mechCrafter,
}