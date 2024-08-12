import { Block, BlockTag } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';

import { Decimal } from '../lib-base/Decimal.js';

import sepolia from "../lib-ethers/deployments/sepolia.json" assert { type: 'json' };

import { panic } from './_utils.js';
import { EthersProvider, EthersSigner } from './ether-types.js';

import {
  _connectToContracts,
  _LiquityContractAddresses,
  _LiquityContracts,
  _LiquityDeploymentJSON
} from './contracts.js';

const deployments: {
  [chainId: number]: _LiquityDeploymentJSON | undefined;
} = {
  [sepolia.chainId]: sepolia,
};

declare const brand: unique symbol;

const branded = <T>(t: Omit<T, typeof brand>): T => t as T;

export interface EthersLiquityConnection extends EthersLiquityConnectionOptionalParams {

  readonly provider: EthersProvider;
  readonly signer?: EthersSigner;
  readonly chainId: number;
  readonly version: string;
  readonly deploymentDate: Date;
  readonly startBlock: number;
  readonly bootstrapPeriod: number;
  readonly totalStabilityPoolHOGReward: Decimal;
  readonly liquidityMiningHOGRewardRate: Decimal;
  readonly addresses: Record<string, string>;
  readonly _priceFeedIsTestnet: boolean;
  readonly _isDev: boolean;
  readonly [brand]: unique symbol;
}

export interface _InternalEthersLiquityConnection extends EthersLiquityConnection {
  readonly addresses: _LiquityContractAddresses;
  readonly _contracts: _LiquityContracts;
}

const connectionFrom = (
  provider: EthersProvider,
  signer: EthersSigner | undefined,
  _contracts: _LiquityContracts,
  {
    deploymentDate,
    totalStabilityPoolHOGReward,
    liquidityMiningHOGRewardRate,
    ...deployment
  }: _LiquityDeploymentJSON,
  optionalParams?: EthersLiquityConnectionOptionalParams
): _InternalEthersLiquityConnection => {
  if (
    optionalParams &&
    optionalParams.useStore !== undefined &&
    !validStoreOptions.includes(optionalParams.useStore)
  ) {
    throw new Error(`Invalid useStore value ${optionalParams.useStore}`);
  }

  return branded({
    provider,
    signer,
    _contracts,
    deploymentDate: new Date(deploymentDate),
    totalStabilityPoolHOGReward: Decimal.from(totalStabilityPoolHOGReward),
    liquidityMiningHOGRewardRate: Decimal.from(liquidityMiningHOGRewardRate),
    ...deployment,
    ...optionalParams
  });
};

export const _getContracts = (connection: EthersLiquityConnection): _LiquityContracts =>
  (connection as _InternalEthersLiquityConnection)._contracts;

const getTimestampFromBlock = ({ timestamp }: Block) => timestamp;

export const _getBlockTimestamp = (
  connection: EthersLiquityConnection,
  blockTag: BlockTag = "latest"
): Promise<number> =>
  _getProvider(connection).getBlock(blockTag).then(getTimestampFromBlock);

export const _requireSigner = (connection: EthersLiquityConnection): EthersSigner =>
  connection.signer ?? panic(new Error("Must be connected through a Signer"));

export const _getProvider = (connection: EthersLiquityConnection): EthersProvider =>
  connection.provider;

export const _requireAddress = (
  connection: EthersLiquityConnection,
  overrides?: { from?: string }
): string =>
  overrides?.from ?? connection.userAddress ?? panic(new Error("A user address is required"));

export const _usingStore = (
  connection: EthersLiquityConnection
): connection is EthersLiquityConnection & { useStore: EthersLiquityStoreOption } =>
  connection.useStore !== undefined;

export class UnsupportedNetworkError extends Error {
  readonly chainId: number;

  constructor(chainId: number) {
    super(`Unsupported network (chainId = ${chainId})`);
    this.name = "UnsupportedNetworkError";
    this.chainId = chainId;
  }
}

const getProviderAndSigner = (
  signerOrProvider: EthersSigner | EthersProvider
): [provider: EthersProvider, signer: EthersSigner | undefined] => {
  const provider: EthersProvider = Signer.isSigner(signerOrProvider)
    ? signerOrProvider.provider ?? panic(new Error("Signer must have a Provider"))
    : signerOrProvider;

  const signer = Signer.isSigner(signerOrProvider) ? signerOrProvider : undefined;

  return [provider, signer];
};

export const _connectToDeployment = (
  deployment: _LiquityDeploymentJSON,
  signerOrProvider: EthersSigner | EthersProvider,
  optionalParams?: EthersLiquityConnectionOptionalParams
): EthersLiquityConnection =>
  connectionFrom(
    ...getProviderAndSigner(signerOrProvider),
    _connectToContracts(signerOrProvider, deployment),
    deployment,
    optionalParams
  );

export type EthersLiquityStoreOption = "blockPolled";

const validStoreOptions = ["blockPolled"];

export interface EthersLiquityConnectionOptionalParams {
  readonly userAddress?: string;
  readonly useStore?: EthersLiquityStoreOption;
}

export function _connectByChainId<T>(
  provider: EthersProvider,
  signer: EthersSigner | undefined,
  chainId: number,
  optionalParams: EthersLiquityConnectionOptionalParams & { useStore: T }
): EthersLiquityConnection & { useStore: T };

export function _connectByChainId(
  provider: EthersProvider,
  signer: EthersSigner | undefined,
  chainId: number,
  optionalParams?: EthersLiquityConnectionOptionalParams
): EthersLiquityConnection;

export function _connectByChainId(
  provider: EthersProvider,
  signer: EthersSigner | undefined,
  chainId: number,
  optionalParams?: EthersLiquityConnectionOptionalParams
): EthersLiquityConnection {
  const deployment: _LiquityDeploymentJSON =
    deployments[chainId] ?? panic(new UnsupportedNetworkError(chainId));

  return connectionFrom(
    provider,
    signer,
    _connectToContracts(provider, deployment),
    deployment,
    optionalParams
  );
}

export const _connect = async (
  signerOrProvider: EthersSigner | EthersProvider,
  optionalParams?: EthersLiquityConnectionOptionalParams
): Promise<EthersLiquityConnection> => {
  const [provider, signer] = getProviderAndSigner(signerOrProvider);

  if (signer) {
    if (optionalParams?.userAddress !== undefined) {
      throw new Error("Can't override userAddress when connecting through Signer");
    }

    optionalParams = {
      ...optionalParams,
      userAddress: await signer.getAddress()
    };
  }

  return _connectByChainId(provider, signer, (await provider.getNetwork()).chainId, optionalParams);
};
