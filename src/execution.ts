import {
  providers,
} from "ethers";

import {MinedReceipt} from "./lib-base/SendableLiquity.js";
import {BFEE_LIQUIDATION_RESERVE} from "./lib-base/constants.js";
import { LiquidationDetails } from "./lib-base/TransactableLiquity.js"
import { Decimal, Decimalish } from "./lib-base/Decimal.js";
import { Trove } from "./lib-base/Trove.js";

import { PopulatedEthersLiquityTransaction } from "./lib-ethers/PopulatableEthersLiquity.js";

export interface ExecutionDetails extends LiquidationDetails {
  minerCut?: Decimal;
}

export type ExecutionResult =
  | { status: "failed"; rawReceipt?: providers.TransactionReceipt }
  | { status: "succeeded"; rawReceipt: providers.TransactionReceipt; details: ExecutionDetails };

export interface Executor {
  estimateCompensation(troves: Trove[], price: Decimalish): Decimal;

  execute(
    liquidation: PopulatedEthersLiquityTransaction<LiquidationDetails>
  ): Promise<ExecutionResult>;
}

const addTroves = (troves: Trove[]) => troves.reduce((a, b) => a.add(b), new Trove());

const expectedCompensation = (
  troves: Trove[],
  price: Decimalish,
  minerCutRate: Decimalish = Decimal.ZERO
) =>
  addTroves(troves)
    .collateral.mulDiv(price, 200) // 0.5% of collateral converted to USD
    .mul(Decimal.ONE.sub(minerCutRate)) // deduct miner's cut
    .add(BFEE_LIQUIDATION_RESERVE.mul(troves.length));

class RawExecutor implements Executor {
  estimateCompensation(troves: Trove[], price: Decimalish): Decimal {
    return expectedCompensation(troves, price);
  }

  async execute(
    liquidation: PopulatedEthersLiquityTransaction<LiquidationDetails>
  ): Promise<MinedReceipt<providers.TransactionReceipt, LiquidationDetails>> {
    const tx = await liquidation.send();

    return tx.waitForReceipt();
  }
}

export const getExecutor = async (): Promise<Executor> => {
  return new RawExecutor();
};
