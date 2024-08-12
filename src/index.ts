import { LiquityStoreState } from './lib-base/LiquityStore.js';
import { connectToLiquity } from "./connection.js";
import { Executor, getExecutor } from "./execution.js";
import { tryToLiquidate } from "./liquidation.js";
import { error, info, warn } from "./logging.js";
import { BlockPolledLiquityStore } from "./lib-ethers/BlockPolledLiquityStore";
import { EthersLiquityWithStore } from "./lib-ethers/EthersLiquity";

const createLiquidationTask = (
  liquity: EthersLiquityWithStore<BlockPolledLiquityStore>,
  executor?: Executor
): (() => void) => {
  let running = false;
  let deferred = false;

  const runLiquidationTask = async () => {
    if (running) {
      deferred = true;
      return;
    }

    running = true;
    await tryToLiquidate(liquity, executor);
    running = false;

    if (deferred) {
      deferred = false;
      runLiquidationTask();
    }
  };

  return runLiquidationTask;
};

const haveUndercollateralizedTroves = (s: LiquityStoreState) => {
  const recoveryMode = s.total.collateralRatioIsBelowCritical(s.price);
  const riskiestTrove = s._riskiestTroveBeforeRedistribution.applyRedistribution(
    s.totalRedistributed
  );

  return recoveryMode
    ? riskiestTrove._nominalCollateralRatio.lt(s.total._nominalCollateralRatio)
    : riskiestTrove.collateralRatioIsBelowMinimum(s.price);
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const main = async () => {
  const liquity = await connectToLiquity();
  const executor = liquity.connection.signer && (await getExecutor());
  const runLiquidationTask = createLiquidationTask(liquity, executor);

  if (!liquity.connection.signer) {
    warn("No 'walletKey' configured; running in read-only mode.");
  }

  liquity.store.onLoaded = () => {
    info("Waiting for price drops...");

    if (haveUndercollateralizedTroves(liquity.store.state)) {
      runLiquidationTask();
    }
  };

  liquity.store.subscribe(({ newState }) => {
    if (haveUndercollateralizedTroves(newState)) {
      runLiquidationTask();
    }
  });

  liquity.store.start();
};

main().catch(err => {
  error("Fatal error:");
  console.error(err);
  process.exit(1);
});

export * from "./config.js";
