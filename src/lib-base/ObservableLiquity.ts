import { Decimal } from "./Decimal.js";
import { Trove, TroveWithPendingRedistribution } from "./Trove.js";
import { StabilityDeposit } from "./StabilityDeposit.js";

export interface ObservableLiquity {
  watchTotalRedistributed(
    onTotalRedistributedChanged: (totalRedistributed: Trove) => void
  ): () => void;

  watchTroveWithoutRewards(
    onTroveChanged: (trove: TroveWithPendingRedistribution) => void,
    address?: string
  ): () => void;

  watchNumberOfTroves(onNumberOfTrovesChanged: (numberOfTroves: number) => void): () => void;

  watchPrice(onPriceChanged: (price: Decimal) => void): () => void;

  watchTotal(onTotalChanged: (total: Trove) => void): () => void;

  watchStabilityDeposit(
    onStabilityDepositChanged: (stabilityDeposit: StabilityDeposit) => void,
    address?: string
  ): () => void;

  watchBFEEInStabilityPool(
    onBFEEInStabilityPoolChanged: (bfeeInStabilityPool: Decimal) => void
  ): () => void;

  watchBFEEBalance(onBFEEBalanceChanged: (balance: Decimal) => void, address?: string): () => void;
}
