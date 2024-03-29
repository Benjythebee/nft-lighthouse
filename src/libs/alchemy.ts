import { Alchemy, AlchemySettings, Network, WebhookType } from "alchemy-sdk";
import env from "../env";

import * as crypto from "crypto";
import { providers } from "ethers";
const settings:{eth:AlchemySettings} = {
  eth:{
    apiKey: env.ALCHEMY_KEY,
    authToken: env.ALCHEMY_AUTH_TOKEN,
    network: Network.ETH_MAINNET, 
  },
};

const alchemyEth = new Alchemy(settings.eth);
export default {alchemyEth}

export const provider = new providers.AlchemyProvider('homestead', env.ALCHEMY_KEY)


export function isValidSignatureForStringBody(
    signature: string, // your "x-alchemy-signature" from header
    signingKey: string, // taken from dashboard for specific webhook
  ): boolean {
    const hmac = crypto.createHmac("sha256", signingKey); // Create a HMAC SHA256 hash using the signing key
    // hmac.update(body, "utf8"); // Update the token hash with the request body using utf8
    const digest = hmac.digest("hex");
    return signature === digest;
}