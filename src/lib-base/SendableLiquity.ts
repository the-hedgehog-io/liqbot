import {
  LiquidationDetails,
  TransactableLiquity,
} from "./TransactableLiquity.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SentLiquityTransaction<S = unknown, T extends LiquityReceipt = LiquityReceipt> {
  readonly rawSentTransaction: S;
}

export type PendingReceipt = { status: "pending" };

export const _pendingReceipt: PendingReceipt = { status: "pending" };
export type FailedReceipt<R = unknown> = { status: "failed"; rawReceipt: R };

export const _failedReceipt = <R>(rawReceipt: R): FailedReceipt<R> => ({
  status: "failed",
  rawReceipt
});

export type SuccessfulReceipt<R = unknown, D = unknown> = {
  status: "succeeded";
  rawReceipt: R;
  details: D;
};

export const _successfulReceipt = <R, D>(
  rawReceipt: R,
  details: D,
  toString?: () => string
): SuccessfulReceipt<R, D> => ({
  status: "succeeded",
  rawReceipt,
  details,
  ...(toString ? { toString } : {})
});

export type MinedReceipt<R = unknown, D = unknown> = FailedReceipt<R> | SuccessfulReceipt<R, D>;

export type LiquityReceipt<R = unknown, D = unknown> = PendingReceipt | MinedReceipt<R, D>;

export type _SendableFrom<T, R, S> = {
  [M in keyof T]: T[M] extends (...args: infer A) => Promise<infer D>
    ? (...args: A) => Promise<SentLiquityTransaction<S, LiquityReceipt<R, D>>>
    : never;
};

export interface SendableLiquity<R = unknown, S = unknown>
  extends _SendableFrom<TransactableLiquity, R, S> {

  liquidate(
    address: string | string[]
  ): Promise<SentLiquityTransaction<S, LiquityReceipt<R, LiquidationDetails>>>;

  liquidateUpTo(
    maximumNumberOfTrovesToLiquidate: number
  ): Promise<SentLiquityTransaction<S, LiquityReceipt<R, LiquidationDetails>>>;
}
