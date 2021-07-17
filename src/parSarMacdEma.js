const {
  fetchAndPrepareValues,
  fetcHighPeriod,
} = require("./backTestPreperation");
const { sellOperation, buyLong, buyShort } = require("./buySellOperations");
const { trendDirection } = require("./technicAnalysis");
const Big = require("big.js");
const {
  MACD,
  PSAR,
  EMA,
  CrossDown,
  CrossUp,
  RSI,
  ATR,
} = require("technicalindicators");
const { intervalToMinute, fillArrayRepating } = require("./utils");

exports.parSarMacdEma = async ({
  pair,
  interval,
  highInterval,
  startFund,
  startDate,
  endDate = new Date(),
  tpMultiplier,
  slMultiplier,
}) => {
  dataset = {};
  await fetchAndPrepareValues(
    pair,
    interval,
    startFund,
    startDate,
    endDate,
    dataset
  );
  await fetcHighPeriod(
    pair,
    highInterval,
    startFund,
    startDate,
    endDate,
    dataset
  );
  
  const macd = MACD.calculate({
    values: dataset.close.map((x) => x.toNumber()),
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const psar = PSAR.calculate({
    high: dataset.high.map((x) => x.toNumber()),
    low: dataset.low.map((x) => x.toNumber()),
    step: 0.02,
    max: 0.2,
  });
  const rsi = RSI.calculate({
    period: 14,
    values: dataset.close.map((x) => x.toNumber()),
  });

  const macdLine = macd.map((element) => element.MACD);
  const macdSignal = macd.map((element) => element.signal);
  const macdCrossUps = CrossUp.calculate({
    lineA: macdLine,
    lineB: macdSignal,
  });
  const macdCrossDowns = CrossDown.calculate({
    lineA: macdLine,
    lineB: macdSignal,
  });
  let atr = ATR.calculate({
    high: dataset.high.map((x) => x.toString()),
    low: dataset.low.map((x) => x.toString()),
    close: dataset.close.map((x) => x.toString()),
    period: 14,
  });
  let ema200HighPeriod=EMA.calculate({
    values:dataset.highClose.map(x=>x.toNumber()),
    period:200
  });
  
  atr = atr.map((x) => new Big(x));
  const repeatAmount=intervalToMinute(highInterval)/intervalToMinute(interval);
  const repeatedEma200= fillArrayRepating(ema200HighPeriod,repeatAmount);
  

  let crossDown, crossUp, crossIdx;
  let sliceStart = 0;
  let sliceEnd = 200;
  for (let i = 200*repeatAmount; i < dataset.high.length; i++) {
    const direction=trendDirection(repeatedEma200.slice(sliceStart,sliceEnd));
    if (dataset.openPositions === 0 && dataset.finalFund > 0) {
      if (macdCrossUps[i]) {
        crossUp = true;
        crossDown = false;
        crossIdx = i;
      }
      if (macdCrossDowns[i]) {
        crossUp = false;
        crossDown = true;
        crossIdx = i;
      }

      if (5 > i - crossIdx) {
        
        if (crossUp && psar[i] < dataset.open[i] && direction=="upward" ) {
          buyLong(dataset, i);
          dataset.stopLoss = dataset.close[i - 1].minus(
            new Big(atr[i]).times(slMultiplier)
          );
          dataset.takeProfit = dataset.close[i - 1].plus(
            new Big(atr[i]).times(tpMultiplier)
          );
        }
        if (crossDown && psar[i] > dataset.open[i] && direction=="downward" ) {
          buyShort(dataset, i);
          dataset.stopLoss = dataset.close[i - 1].plus(
            new Big(atr[i]).times(slMultiplier)
          );
          dataset.takeProfit = dataset.close[i - 1].minus(
            new Big(atr[i]).times(tpMultiplier)
          );
        }
      } else {
        crossIdx = 0;
      }
    } else if (dataset.openPositions === 1) {
      sellOperation(dataset, i);
    }
    sliceStart++;
    sliceEnd++;
  }

  if (dataset.openPositions === 1) {
    dataset.finalFund = dataset.coinAmount.times(
      dataset.close[dataset.close.length - 1]
    );
  }

  console.log(`openposition ${dataset.openPositions}`);
  let percentage = dataset.finalFund.minus(startFund).div(startFund);

  console.log(`
              start Fund ${startFund}
              final Fund ${dataset.finalFund.toFixed(2)} 
              total Order ${dataset.totalOrder}
              total successful orders ${
                dataset.successLongOrder + dataset.successShortOrder
              }
              total failed orders ${
                dataset.failedShortOrder + dataset.failedLongOrder
              }
              successful  long orders ${dataset.successLongOrder}
              failed long orders ${dataset.failedLongOrder}
              successful short orders ${dataset.successShortOrder}
              failed short orders ${dataset.failedShortOrder}
              percentage ${percentage}
              `);
};

