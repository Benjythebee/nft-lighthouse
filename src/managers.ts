import { Network } from "alchemy-sdk"
import alchemy from "./libs/alchemy"
import { contractAddresses } from "./libs/constants"
import WebHookManager from "./libs/webhookManager"

export const webHookManagerEth = new WebHookManager(alchemy.alchemyEth, Object.values(contractAddresses.eth), Network.ETH_MAINNET)
export const webHookManagerGoerli = new WebHookManager(alchemy.alchemyGoerli, Object.values(contractAddresses.goerli), Network.ETH_GOERLI)
