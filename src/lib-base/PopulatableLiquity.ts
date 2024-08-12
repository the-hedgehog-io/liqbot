import { LiquityReceipt, SendableLiquity, SentLiquityTransaction } from "./SendableLiquity.js";

import {
  LiquidationDetails,
} from "./TransactableLiquity.js";

export interface PopulatedLiquityTransaction<
  P = unknown,
  T extends SentLiquityTransaction = SentLiquityTransaction
> {
  readonly rawPopulatedTransaction: P;
  send(): Promise<T>;
}

export type _PopulatableFrom<T, P> = {
  [M in keyof T]: T[M] extends (...args: infer A) => Promise<infer U>
    ? U extends SentLiquityTransaction
      ? (...args: A) => Promise<PopulatedLiquityTransaction<P, U>>
      : never
    : never;
};

export interface PopulatableLiquity<R = unknown, S = unknown, P = unknown>
  extends _PopulatableFrom<SendableLiquity<R, S>, P> {

  liquidate(
    address: string | string[]
  ): Promise<
    PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, LiquidationDetails>>>
  >;

  liquidateUpTo(
    maximumNumberOfTrovesToLiquidate: number
  ): Promise<
    PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, LiquidationDetails>>>
  >;
}
