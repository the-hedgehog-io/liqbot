import { Decimal } from "./Decimal.js";
import { Trove, TroveWithPendingRedistribution, UserTrove } from "./Trove.js";
import { Fees } from "./Fees.js";

export interface TroveListingParams {
  readonly first: number;
  readonly sortedBy: "ascendingCollateralRatio" | "descendingCollateralRatio";
  readonly startingAt?: number;
  readonly beforeRedistribution?: boolean;
}

export interface ReadableLiquity {
  getTotalRedistributed(): Promise<Trove>;
  getNumberOfTroves(): Promise<number>;
  getPrice(): Promise<Decimal>;
  getTotal(): Promise<Trove>;
  getBaseFeeLMAInStabilityPool(): Promise<Decimal>;
  getTroves(
    params: TroveListingParams & { beforeRedistribution: true }
  ): Promise<TroveWithPendingRedistribution[]>;
  getTroves(params: TroveListingParams): Promise<UserTrove[]>;
  getFees(): Promise<Fees>;
}
