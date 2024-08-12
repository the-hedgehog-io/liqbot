import { Decimal } from "./Decimal.js";
import { Trove } from "./Trove.js";
import { FailedReceipt } from "./SendableLiquity.js";

export class TransactionFailedError<T extends FailedReceipt = FailedReceipt> extends Error {
  readonly failedReceipt: T;

  constructor(name: string, message: string, failedReceipt: T) {
    super(message);
    this.name = name;
    this.failedReceipt = failedReceipt;
  }
}

export interface LiquidationDetails {
  liquidatedAddresses: string[];
  totalLiquidated: Trove;
  bfeeGasCompensation: Decimal;
  collateralGasCompensation: Decimal;
}

export interface TransactableLiquity {
  liquidate(address: string | string[]): Promise<LiquidationDetails>;
  liquidateUpTo(maximumNumberOfTrovesToLiquidate: number): Promise<LiquidationDetails>;
}
