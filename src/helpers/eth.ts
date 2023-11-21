import {utils} from 'ethers'
import {ABIS} from '@cyberbrokers/eth-utils'


export const mechInterface = new utils.Interface(ABIS.mechAbi)
export const mechCraftInterface = new utils.Interface(ABIS.mechAssemblerAbi)
