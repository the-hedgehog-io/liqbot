import assert from "assert";
import { AddressZero } from "@ethersproject/constants";

import { LiquityStore, LiquityStoreBaseState } from "../lib-base/LiquityStore.js";
import { Fees } from "../lib-base/Fees.js";
import { Decimal } from "../lib-base/Decimal.js";
import { TroveWithPendingRedistribution } from "../lib-base/Trove.js";

import { decimalify, promiseAllValues } from './_utils.js';
import { ReadableEthersLiquity } from './ReadableEthersLiquity.js';
import { EthersLiquityConnection, _getProvider } from './EthersLiquityConnection.js';
import { EthersCallOverrides, EthersProvider } from './ether-types.js';

export interface BlockPolledLiquityStoreExtraState {
  blockTag?: number;
  blockTimestamp: number;
  _feesFactory: (blockTimestamp: number, recoveryMode: boolean) => Fees;
}

export class BlockPolledLiquityStore extends LiquityStore<BlockPolledLiquityStoreExtraState> {
  readonly connection: EthersLiquityConnection;

  private readonly _readable: ReadableEthersLiquity;
  private readonly _provider: EthersProvider;

  constructor(readable: ReadableEthersLiquity) {
    super();

    this.connection = readable.connection;
    this._readable = readable;
    this._provider = _getProvider(readable.connection);
  }

  private async _getRiskiestTroveBeforeRedistribution(
    overrides?: EthersCallOverrides
  ): Promise<TroveWithPendingRedistribution> {
    const riskiestTroves = await this._readable.getTroves(
      { first: 1, sortedBy: "ascendingCollateralRatio", beforeRedistribution: true },
      overrides
    );

    if (riskiestTroves.length === 0) {
      return new TroveWithPendingRedistribution(AddressZero, "nonExistent");
    }

    return riskiestTroves[0];
  }

  private async _get(
    blockTag?: number
  ): Promise<[baseState: LiquityStoreBaseState, extraState: BlockPolledLiquityStoreExtraState]> {
    const { userAddress } = this.connection;

    const {
      blockTimestamp,
      _feesFactory,
      ...baseState
    } = await promiseAllValues({
      blockTimestamp: this._readable._getBlockTimestamp(blockTag),
      _feesFactory: this._readable._getFeesFactory({ blockTag }),

      price: this._readable.getPrice({ blockTag }),
      numberOfTroves: this._readable.getNumberOfTroves({ blockTag }),
      totalRedistributed: this._readable.getTotalRedistributed({ blockTag }),
      total: this._readable.getTotal({ blockTag }),
      baseFeeLMAInStabilityPool: this._readable.getBaseFeeLMAInStabilityPool({ blockTag }),
      _riskiestTroveBeforeRedistribution: this._getRiskiestTroveBeforeRedistribution({ blockTag }),

      ...(userAddress
        ? {
            accountBalance: this._provider.getBalance(userAddress, blockTag).then(decimalify)
            }
        : {
            accountBalance: Decimal.ZERO,
          })
    });

    return [
      {
        ...baseState,
        _feesInNormalMode: _feesFactory(blockTimestamp, false)
      },
      {
        blockTag,
        blockTimestamp,
        _feesFactory
      }
    ];
  }

  protected _doStart(): () => void {
    this._get().then(state => {
      if (!this._loaded) {
        this._load(...state);
      }
    });

    const handleBlock = async (blockTag: number) => {
      const state = await this._get(blockTag);

      if (this._loaded) {
        this._update(...state);
      } else {
        this._load(...state);
      }
    };

    let latestBlock: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const blockListener = (blockTag: number) => {
      latestBlock = Math.max(blockTag, latestBlock ?? blockTag);

      if (timerId !== undefined) {
        clearTimeout(timerId);
      }

        timerId = setTimeout(() => {
        assert(latestBlock !== undefined);
        handleBlock(latestBlock);
      }, 50);
    };

    this._provider.on("block", blockListener);

    return () => {
      this._provider.off("block", blockListener);

      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
    };
  }

  protected _reduceExtra(
    oldState: BlockPolledLiquityStoreExtraState,
    stateUpdate: Partial<BlockPolledLiquityStoreExtraState>
  ): BlockPolledLiquityStoreExtraState {
    return {
      blockTag: stateUpdate.blockTag ?? oldState.blockTag,
      blockTimestamp: stateUpdate.blockTimestamp ?? oldState.blockTimestamp,
      _feesFactory: stateUpdate._feesFactory ?? oldState._feesFactory
    };
  }
}
