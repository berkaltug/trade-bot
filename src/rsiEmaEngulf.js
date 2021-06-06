const { getCoinPrices } = require("./operations");
const talib = require("talib");
const _ = require("lodash");
const { engulfingCheck } = require("./technicAnalysis");
const { intervalToMs } = require("./utils");
const Big = require("big.js");
const {  buySellOperation } = require("./buySellOperations");
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
  const dataset = {};
  dataset.finalFund = startFund;
  dataset.takeProfit = 0;
  dataset.stopLoss = 0;
  (dataset.openPositions = 0),
    (dataset.totalOrder = 0),
    (dataset.successLongOrder = 0),
    (dataset.successShortOrder = 0),
    (dataset.failedLongOrder = 0),
    (dataset.failedShortOrder = 0);
  dataset.coinAmount = 0;
  dataset.positionType;
  dataset.shortHelper = new Big(0); // short pozisyonda kar-zarar hesaplarken alış bakiyesini burda saklıcaz
  const startMs = startDate?.getTime();
  const endMs = endDate?.getTime();
  const dividerMs = intervalToMs(interval);
  const candlesticks = (endMs - startMs) / dividerMs;
  const limit = 1000;
  console.log(`candlesticks ${candlesticks}`);
  const requestCount = Math.ceil(candlesticks / limit);
  console.log(
    ` startDate ${startDate} endDate ${endDate} requestCount ${requestCount} `
  );
  console.log("fetching prices...");

  dataset.high = [];
  dataset.low = [];
  dataset.close = [];
  dataset.open = [];
  ticksArray = [];
  let lastDateMs = startMs + dividerMs * limit;
  for (let i = 0; i < requestCount; i++) {
    try {
      let ticks = await getCoinPrices({
        pair,
        interval,
        limit,
        endDate: lastDateMs,
      });
      ticksArray.push(ticks);
    } catch (error) {
      console.error(error);
    }
    lastDateMs += dividerMs * limit;
  }
  _.forEach(ticksArray, (ticks, index) => {
    _.forEach(ticks, (value, index) => {
      dataset.open.push(new Big(value[1]));
      dataset.high.push(new Big(value[2]));
      dataset.low.push(new Big(value[3]));
      dataset.close.push(new Big(value[4]));
    });
  });

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
          //long alım yapıyor
          dataset.openPositions = 1;
          dataset.positionType = "long";
          dataset.totalOrder++;
          //komisyon kesimi
          dataset.finalFund = dataset.finalFund.minus(
            dataset.finalFund.div(100000).times(75)
          );
          dataset.coinAmount = dataset.finalFund.div(dataset.close[i - 1]);
          dataset.finalFund = new Big(0);
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
          //bearish senaryosu buraya
          dataset.openPositions = 1;
          dataset.positionType = "short";
          dataset.totalOrder++;
          //komisyon kesimi
          dataset.finalFund = dataset.finalFund.minus(
            dataset.finalFund.div(100000).times(75)
          );
          dataset.shortHelper = dataset.finalFund;
          dataset.coinAmount = dataset.finalFund.div(dataset.close[i - 1]);
          dataset.finalFund = new Big(0);
          dataset.stopLoss = dataset.close[i - 1].plus(
            dataset.open[i - 1].minus(dataset.close[i - 1]).times(slMultiplier)
          );
          dataset.takeProfit = dataset.close[i - 1].minus(
            dataset.open[i - 1].minus(dataset.close[i - 1]).times(tpMultiplier)
          );
        }
      }
    } else if (dataset.openPositions === 1) {
      buySellOperation(dataset,i)
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
