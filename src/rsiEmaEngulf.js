const { getCoinPrices } = require("./operations");
const talib = require("talib");
const _ = require("lodash");
const { engulfingCheck } = require("./technicAnalysis");
const { intervalToMs } = require("./utils");
const Big = require("big.js");
const {  SellOperation, SellOperationNoCommission, buyShort, buyLong, buyLongNoCommission, buyShortNoCommission } = require("./buySellOperations");
const { fetchAndPrepareValues } = require("./backTestPreperation");
Big.DP = 10;
exports.testRsiEmaEngulf = async ({
  pair,
  interval,
  startFund,
  startDate,
  endDate = new Date(),
  tpMultiplier,
  slMultiplier,
}) => {
  const dataset={};
  await fetchAndPrepareValues(pair,interval,startFund,startDate,endDate,dataset);
  let ema200 = talib.execute({
    name: "EMA",
    startIdx: 0,
    endIdx: dataset.close.length - 1,
    inReal: dataset.close,
    optInTimePeriod: 200,
  });
  let ema50 = talib.execute({
    name: "EMA",
    startIdx: 0,
    endIdx: dataset.close.length - 1,
    inReal: dataset.close,
    optInTimePeriod: 50,
  });
  let rsi = talib.execute({
    name: "RSI",
    startIdx: 0,
    endIdx: dataset.close.length - 1,
    inReal: dataset.close,
    optInTimePeriod: 14,
  });
  var atr = talib.execute({
    name: "ATR",
    startIdx: 0,
    endIdx: dataset.close.length - 1,
    high: dataset.high,
    low: dataset.low,
    close: dataset.close,
    optInTimePeriod: 14,
  });
  // strateji test ediliyor
  const rsiResult = rsi.result.outReal;
  const ema200Result = ema200.result.outReal;
  const atrResult = atr.result.outReal;
  for (let i = ema200.begIndex; i < ema200Result.length; i++) {
    if (dataset.openPositions === 0 && dataset.finalFund > 0) {
      let engulf = engulfingCheck(
        dataset.close[i - 1],
        dataset.open[i - 1],
        dataset.close[i - 2],
        dataset.open[i - 2]
      );
      if (engulf === "bullish") {
        if (dataset.open[i] > ema200Result[i] && rsiResult[i] > 50) {
          buyLong(dataset,i);
          dataset.stopLoss = dataset.close[i - 1].minus(
            dataset.close[i - 1].minus(dataset.open[i - 1]).times(slMultiplier)
          );
          dataset.takeProfit = dataset.close[i - 1].plus(
            dataset.close[i - 1].minus(dataset.open[i - 1]).times(tpMultiplier)
          );
        }
      }
      if (engulf === "bearish") {
        if (dataset.open[i] < ema200Result[i] && rsiResult[i] < 50) {
          buyShort(dataset,i);
          dataset.stopLoss = dataset.close[i - 1].plus(
            dataset.open[i - 1].minus(dataset.close[i - 1]).times(slMultiplier)
          );
          dataset.takeProfit = dataset.close[i - 1].minus(
            dataset.open[i - 1].minus(dataset.close[i - 1]).times(tpMultiplier)
          );
        }
      }
    } else if (dataset.openPositions === 1) {
      SellOperation(dataset,i)
    }
  }

  if(dataset.openPositions===1){
    dataset.finalFund=dataset.coinAmount.times(dataset.close[dataset.close.length-1]);
  }

  console.log(`openposition ${dataset.openPositions}`);
  let percentage = dataset.finalFund
    .minus(startFund)
    .div(startFund);

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
              
              `);
};
