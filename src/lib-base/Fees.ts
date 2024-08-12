import assert from "assert";

import { Decimal, Decimalish } from "./Decimal.js";

import {
  MAXIMUM_BORROWING_RATE,
  MINIMUM_BORROWING_RATE,
  MINIMUM_REDEMPTION_RATE
} from "./constants.js";

export class Fees {
  private readonly _baseRateWithoutDecay: Decimal;
  private readonly _minuteDecayFactor: Decimal;
  private readonly _beta: Decimal;
  private readonly _lastFeeOperation: Date;
  private readonly _timeOfLatestBlock: Date;
  private readonly _recoveryMode: boolean;

  constructor(
    baseRateWithoutDecay: Decimalish,
    minuteDecayFactor: Decimalish,
    beta: Decimalish,
    lastFeeOperation: Date,
    timeOfLatestBlock: Date,
    recoveryMode: boolean
  ) {
    this._baseRateWithoutDecay = Decimal.from(baseRateWithoutDecay);
    this._minuteDecayFactor = Decimal.from(minuteDecayFactor);
    this._beta = Decimal.from(beta);
    this._lastFeeOperation = lastFeeOperation;
    this._timeOfLatestBlock = timeOfLatestBlock;
    this._recoveryMode = recoveryMode;

    assert(this._minuteDecayFactor.lt(1));
  }

  _setRecoveryMode(recoveryMode: boolean): Fees {
    return new Fees(
      this._baseRateWithoutDecay,
      this._minuteDecayFactor,
      this._beta,
      this._lastFeeOperation,
      this._timeOfLatestBlock,
      recoveryMode
    );
  }

  equals(that: Fees): boolean {
    return (
      this._baseRateWithoutDecay.eq(that._baseRateWithoutDecay) &&
      this._minuteDecayFactor.eq(that._minuteDecayFactor) &&
      this._beta.eq(that._beta) &&
      this._lastFeeOperation.getTime() === that._lastFeeOperation.getTime() &&
      this._timeOfLatestBlock.getTime() === that._timeOfLatestBlock.getTime() &&
      this._recoveryMode === that._recoveryMode
    );
  }

  toString(): string {
    return (
      `{ baseRateWithoutDecay: ${this._baseRateWithoutDecay}` +
      `, lastFeeOperation: "${this._lastFeeOperation.toLocaleString()}"` +
      `, recoveryMode: ${this._recoveryMode} } `
    );
  }

  baseRate(when = this._timeOfLatestBlock): Decimal {
    const millisecondsSinceLastFeeOperation = Math.max(
      when.getTime() - this._lastFeeOperation.getTime(),
      0 // Clamp negative elapsed time to 0, in case the client's time is in the past.
      // We will calculate slightly higher than actual fees, which is fine.
    );

    const minutesSinceLastFeeOperation = Math.floor(millisecondsSinceLastFeeOperation / 60000);

    return this._minuteDecayFactor.pow(minutesSinceLastFeeOperation).mul(this._baseRateWithoutDecay);
  }

  borrowingRate(when?: Date): Decimal {
    return this._recoveryMode
      ? Decimal.ZERO
      : Decimal.min(MINIMUM_BORROWING_RATE.add(this.baseRate(when)), MAXIMUM_BORROWING_RATE);
  }

  redemptionRate(redeemedFractionOfSupply: Decimalish = Decimal.ZERO, when?: Date): Decimal {
    redeemedFractionOfSupply = Decimal.from(redeemedFractionOfSupply);
    let baseRate = this.baseRate(when);

    if (redeemedFractionOfSupply.nonZero) {
      baseRate = redeemedFractionOfSupply.div(this._beta).add(baseRate);
    }

    return Decimal.min(MINIMUM_REDEMPTION_RATE.add(baseRate), Decimal.ONE);
  }
}
