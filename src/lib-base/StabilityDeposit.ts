import { Decimal } from "./Decimal.js";

export type StabilityDepositChange<T> =
  | { depositBFEE: T; withdrawBFEE?: undefined }
  | { depositBFEE?: undefined; withdrawBFEE: T; withdrawAllBFEE: boolean };

export class StabilityDeposit {
  readonly initialBFEE: Decimal;
  readonly currentBFEE: Decimal;
  readonly collateralGain: Decimal;
  readonly hogReward: Decimal;

  constructor(
    initialBFEE: Decimal,
    currentBFEE: Decimal,
    collateralGain: Decimal,
    hogReward: Decimal,
  ) {
    this.initialBFEE = initialBFEE;
    this.currentBFEE = currentBFEE;
    this.collateralGain = collateralGain;
    this.hogReward = hogReward;

    if (this.currentBFEE.gt(this.initialBFEE)) {
      throw new Error("currentBFEE can't be greater than initialBFEE");
    }
  }

  get isEmpty(): boolean {
    return (
      this.initialBFEE.isZero &&
      this.currentBFEE.isZero &&
      this.collateralGain.isZero &&
      this.hogReward.isZero
    );
  }

  toString(): string {
    return (
      `{ initialBFEE: ${this.initialBFEE}` +
      `, currentBFEE: ${this.currentBFEE}` +
      `, collateralGain: ${this.collateralGain}` +
      `, hogReward: ${this.hogReward} }`
    );
  }

  equals(that: StabilityDeposit): boolean {
    return (
      this.initialBFEE.eq(that.initialBFEE) &&
      this.currentBFEE.eq(that.currentBFEE) &&
      this.collateralGain.eq(that.collateralGain) &&
      this.hogReward.eq(that.hogReward)
    );
  }
}
