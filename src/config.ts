import 'dotenv/config';
import { providers } from 'ethers';
const privateKey = process.env.PRIVATE_KEY;
const network = "sepolia";

const rpcLocation = process.env.RPC_URL;
const chainId = providers.getNetwork(network).chainId;

export interface LiqbotConfig {
  /** JSON-RPC URL of Ethereum node. */
  httpRpcUrl: string;

  /** Chain ID of the network the Ethereum node is running on. */
  chainId: number;

  /**
   * Private key of the account that will be used to send liquidation transactions.
   *
   * This account needs to hold enough ETH to pay for the gas costs of liquidation. If omitted,
   * liqbot will run in "read-only" mode where it simply looks for and logs liquidation
   * opportunities, but doesn't act on them.
   */
  walletKey?: string;

  /** Optional WebSocket URL to use for real-time block events. */
  wsRpcUrl?: string;

  /**
   * Maximum priority fee to pay for the transaction per unit of gas consumed, in wei.
   * The default is 5 Gwei (i.e. 5 billion wei).
   */
  maxPriorityFeePerGas?: number;

  /**
   * Can be used to limit gas costs by putting an upper limit on the number of Troves that will be
   * included in liquidation attempts (default: 10).
   */
  maxTrovesToLiquidate?: number;
}

const config: LiqbotConfig = {
  httpRpcUrl: `https://${rpcLocation}`,
  wsRpcUrl: `wss://${rpcLocation}`,
  chainId,
  walletKey: privateKey,
  maxPriorityFeePerGas: 5000000000,
};

export default config;
