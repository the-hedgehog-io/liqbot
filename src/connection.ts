import WebSocket from "ws";
import { providers, Wallet } from "ethers";
import { Batched, WebSocketAugmented } from "@liquity/providers";

import { EthersLiquity, EthersLiquityWithStore } from './lib-ethers/EthersLiquity.js';
import { BlockPolledLiquityStore } from "./lib-ethers/BlockPolledLiquityStore.js";
import config from "./config.js";


const { StaticJsonRpcProvider } = providers;
const BatchedWebSocketAugmentedProvider = Batched(WebSocketAugmented(StaticJsonRpcProvider));

Object.assign(globalThis, { WebSocket });

export const connectToLiquity = async (): Promise<
  EthersLiquityWithStore<BlockPolledLiquityStore>
> => {
  const provider = new BatchedWebSocketAugmentedProvider(config.httpRpcUrl);
  const network = await provider.getNetwork();

  if (network.chainId !== config.chainId) {
    throw new Error(`chainId mismatch (got ${network.chainId} instead of ${config.chainId})`);
  }

  provider.chainId = network.chainId;

  if (config.wsRpcUrl) {
    provider.openWebSocket(config.wsRpcUrl, network);
  }

  return EthersLiquity.connect(
    config.walletKey ? new Wallet(config.walletKey, provider) : provider,
    { useStore: "blockPolled" }
  );
};
