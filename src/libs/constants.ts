import {getCbContractsByChainId} from '@cyberbrokers/eth-utils'

export const mintContractAddresses ={
    mechs:getCbContractsByChainId(1).mechCrafter,
    mechsGoerli:getCbContractsByChainId(5).mechCrafter,
}

export const contractAddresses = {
    goerli:{
        'genesis-mechs':getCbContractsByChainId(5).mechAddress,
        'cyberbrokers':getCbContractsByChainId(5).cyberBrokersAddress,
        'unrevealed-mech-parts':getCbContractsByChainId(5).unrevealedAddress,
        'revealed-mech-parts':getCbContractsByChainId(5).revealedAddress,
        'afterglow':getCbContractsByChainId(5).afterGlowAddress,
        'accolades':getCbContractsByChainId(5).cyberbrokersAccolades,
    },
    eth:{
        'genesis-mechs':getCbContractsByChainId(1).mechAddress,
        'cyberbrokers':getCbContractsByChainId(1).cyberBrokersAddress,
        'unrevealed-mech-parts':getCbContractsByChainId(1).unrevealedAddress,
        'revealed-mech-parts':getCbContractsByChainId(1).revealedAddress,
        'afterglow':getCbContractsByChainId(1).afterGlowAddress,
        'accolades':getCbContractsByChainId(1).cyberbrokersAccolades,
    }
    
}