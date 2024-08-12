import { utils, providers, BigNumber } from "ethers";

import { LiquidationDetails } from "./lib-base/TransactableLiquity.js"
import { Decimal } from "./lib-base/Decimal.js";
import { Trove } from "./lib-base/Trove.js";

const troveLiquidatedTopic = utils.keccak256(
  utils.toUtf8Bytes("TroveLiquidated(address,uint256,uint256,uint8)")
);

const liquidationParamTypes = ["uint256", "uint256", "uint256", "uint256"];

const liquidationTopic = utils.keccak256(
  utils.toUtf8Bytes(`Liquidation(${liquidationParamTypes.join(",")})`)
);

const decimalify = (bigNumber: BigNumber): Decimal =>
  Decimal.fromBigNumberString(bigNumber.toHexString());

export const getLiquidationDetails = (
  troveManagerAddress: string,
  logs: providers.Log[]
): LiquidationDetails => {
  const troveManagerEvents = logs.filter(log => log.address === troveManagerAddress);

  const liquidatedAddresses = troveManagerEvents
    .filter(log => log.topics[0] === troveLiquidatedTopic)
    .map<readonly string[]>(log => utils.defaultAbiCoder.decode(["address"], log.topics[1]))
    .map(([_borrower]) => utils.getAddress(_borrower));

  const [totals] = troveManagerEvents
    .filter(log => log.topics[0] === liquidationTopic)
    .map<readonly BigNumber[]>(log => utils.defaultAbiCoder.decode(liquidationParamTypes, log.data))
    .map(([_liquidatedDebt, _liquidatedColl, _collGasCompensation, _BFEEGasCompensation]) => ({
      collateralGasCompensation: decimalify(_collGasCompensation),
      bfeeGasCompensation: decimalify(_BFEEGasCompensation),
      totalLiquidated: new Trove(decimalify(_liquidatedColl), decimalify(_liquidatedDebt))
    }));

  return {
    liquidatedAddresses,
    ...totals
  };
};
