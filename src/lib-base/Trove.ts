import { Decimal, Decimalish } from "./Decimal.js";

import {
  MINIMUM_COLLATERAL_RATIO,
  CRITICAL_COLLATERAL_RATIO,
  BFEE_LIQUIDATION_RESERVE
} from "./constants.js";

const NOMINAL_COLLATERAL_RATIO_PRECISION = Decimal.from(100);

export class Trove {
  readonly collateral: Decimal;
  readonly debt: Decimal;

  constructor(collateral = Decimal.ZERO, debt = Decimal.ZERO) {
    this.collateral = collateral;
    this.debt = debt;
  }

  get isEmpty(): boolean {
    return this.collateral.isZero && this.debt.isZero;
  }

  get netDebt(): Decimal {
    if (this.debt.lt(BFEE_LIQUIDATION_RESERVE)) {
      throw new Error(`netDebt should not be used when debt < ${BFEE_LIQUIDATION_RESERVE}`);
    }

    return this.debt.sub(BFEE_LIQUIDATION_RESERVE);
  }

  get _nominalCollateralRatio(): Decimal {
    return this.collateral.mulDiv(NOMINAL_COLLATERAL_RATIO_PRECISION, this.debt);
  }

  collateralRatio(price: Decimalish): Decimal {
    return this.collateral.div(this.debt.mul(price));
  }

  collateralRatioIsBelowMinimum(price: Decimalish): boolean {
    return this.collateralRatio(price).lt(MINIMUM_COLLATERAL_RATIO);
  }

  collateralRatioIsBelowCritical(price: Decimalish): boolean {
    return this.collateralRatio(price).lt(CRITICAL_COLLATERAL_RATIO);
  }

  isOpenableInRecoveryMode(price: Decimalish): boolean {
    return this.collateralRatio(price).gte(CRITICAL_COLLATERAL_RATIO);
  }

  toString(): string {
    return `{ collateral: ${this.collateral}, debt: ${this.debt} }`;
  }

  equals(that: Trove): boolean {
    return this.collateral.eq(that.collateral) && this.debt.eq(that.debt);
  }

  add(that: Trove): Trove {
    return new Trove(this.collateral.add(that.collateral), this.debt.add(that.debt));
  }

  addCollateral(collateral: Decimalish): Trove {
    return new Trove(this.collateral.add(collateral), this.debt);
  }

  addDebt(debt: Decimalish): Trove {
    return new Trove(this.collateral, this.debt.add(debt));
  }

  subtract(that: Trove): Trove {
    const { collateral, debt } = that;

    return new Trove(
      this.collateral.gt(collateral) ? this.collateral.sub(collateral) : Decimal.ZERO,
      this.debt.gt(debt) ? this.debt.sub(debt) : Decimal.ZERO
    );
  }

  subtractCollateral(collateral: Decimalish): Trove {
    return new Trove(
      this.collateral.gt(collateral) ? this.collateral.sub(collateral) : Decimal.ZERO,
      this.debt
    );
  }

  subtractDebt(debt: Decimalish): Trove {
    return new Trove(this.collateral, this.debt.gt(debt) ? this.debt.sub(debt) : Decimal.ZERO);
  }

  multiply(multiplier: Decimalish): Trove {
    return new Trove(this.collateral.mul(multiplier), this.debt.mul(multiplier));
  }

  setCollateral(collateral: Decimalish): Trove {
    return new Trove(Decimal.from(collateral), this.debt);
  }

  setDebt(debt: Decimalish): Trove {
    return new Trove(this.collateral, Decimal.from(debt));
  }
}

export const _emptyTrove = new Trove();

export type UserTroveStatus =
  | "nonExistent"
  | "open"
  | "closedByOwner"
  | "closedByLiquidation"
  | "closedByRedemption";

export class UserTrove extends Trove {
  readonly ownerAddress: string;
  readonly status: UserTroveStatus;

  constructor(ownerAddress: string, status: UserTroveStatus, collateral?: Decimal, debt?: Decimal) {
    super(collateral, debt);

    this.ownerAddress = ownerAddress;
    this.status = status;
  }

  equals(that: UserTrove): boolean {
    return (
      super.equals(that) && this.ownerAddress === that.ownerAddress && this.status === that.status
    );
  }

  toString(): string {
    return (
      `{ ownerAddress: "${this.ownerAddress}"` +
      `, collateral: ${this.collateral}` +
      `, debt: ${this.debt}` +
      `, status: "${this.status}" }`
    );
  }
}

export class TroveWithPendingRedistribution extends UserTrove {
  private readonly stake: Decimal;
  private readonly snapshotOfTotalRedistributed: Trove;

  /** @internal */
  constructor(
    ownerAddress: string,
    status: UserTroveStatus,
    collateral?: Decimal,
    debt?: Decimal,
    stake = Decimal.ZERO,
    snapshotOfTotalRedistributed = _emptyTrove
  ) {
    super(ownerAddress, status, collateral, debt);

    this.stake = stake;
    this.snapshotOfTotalRedistributed = snapshotOfTotalRedistributed;
  }

  applyRedistribution(totalRedistributed: Trove): UserTrove {
    const afterRedistribution = this.add(
      totalRedistributed.subtract(this.snapshotOfTotalRedistributed).multiply(this.stake)
    );

    return new UserTrove(
      this.ownerAddress,
      this.status,
      afterRedistribution.collateral,
      afterRedistribution.debt
    );
  }

  equals(that: TroveWithPendingRedistribution): boolean {
    return (
      super.equals(that) &&
      this.stake.eq(that.stake) &&
      this.snapshotOfTotalRedistributed.equals(that.snapshotOfTotalRedistributed)
    );
  }
}
