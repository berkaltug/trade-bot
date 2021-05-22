const { getCoinPrices } = require("./operations");
const talib = require("talib");
const _ = require("lodash");
const { engulfingCheck } = require("./technicAnalysis");
const {intervalToMs} = require('./utils');
const Big = require('big.js');
Big.DP=10;
exports.testRsiEmaEngulf = async ({
  pair,
  interval,
  startFund,
  startDate,
  endDate = new Date(),
  tpMultiplier,
  slMultiplier,
}) => {
  let finalFund = startFund;
  let takeProfit = 0,
    stopLoss = 0;
  let openPositions = 0,
    totalOrder = 0,
    successLongOrder = 0,
    successShortOrder = 0,
    failedLongOrder = 0,
    failedShortOrder = 0;
  let coinAmount = 0;
  let positionType;
  let=shortHelper=new Big(0); // short pozisyonda kar-zarar hesaplarken alış bakiyesini burda saklıcaz
  const startMs = startDate?.getTime();
  const endMs = endDate?.getTime();
  const dividerMs = intervalToMs(interval);
  const candlesticks = (endMs-startMs) / dividerMs;
  const limit = 1000;
  console.log(`candlesticks ${candlesticks}`);
  const requestCount = Math.ceil(candlesticks / limit);
  console.log(
    ` startDate ${startDate} endDate ${endDate} requestCount ${requestCount} `
  );
  console.log("fetching prices...");

  let high = [],
    low = [],
    close = [],
    open = [];
  ticksArray = [];
  let lastDateMs=startMs + (dividerMs * limit);
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
    lastDateMs+=dividerMs*limit;
  }
  _.forEach(ticksArray, (ticks, index) => {
    _.forEach(ticks, (value, index) => {
      open.push(new Big(value[1]));
      high.push(new Big(value[2]));
      low.push(new Big(value[3]));
      close.push(new Big(value[4]));
    });
  });

  let ema200 = talib.execute({
    name: "EMA",
    startIdx: 0,
    endIdx: close.length - 1,
    inReal: close,
    optInTimePeriod: 200,
  });
  let ema50 = talib.execute({
    name: "EMA",
    startIdx: 0,
    endIdx: close.length - 1,
    inReal: close,
    optInTimePeriod: 50,
  });
  let rsi = talib.execute({
    name: "RSI",
    startIdx: 0,
    endIdx: close.length - 1,
    inReal: close,
    optInTimePeriod: 14,
  });
  var atr = talib.execute({
    name: "ATR",
    startIdx: 0,
    endIdx: close.length - 1,
    high,
    low,
    close,
    optInTimePeriod: 14,
  });
  // strateji test ediliyor
  const rsiResult = rsi.result.outReal;
  const ema200Result = ema200.result.outReal;
  const atrResult = atr.result.outReal;
  for (let i = ema200.begIndex; i < ema200Result.length; i++) {
    if (openPositions === 0 && finalFund > 0 ) {
      let engulf = engulfingCheck(
        close[i - 1],
        open[i - 1],
        close[i - 2],
        open[i - 2]
      );
      if (engulf === "bullish") {
        if (open[i] > ema200Result[i] && rsiResult[i] > 50) {
          //long alım yapıyor
          openPositions = 1;
          positionType = "long";
          totalOrder++;
          //komisyon kesimi
          finalFund=finalFund.minus(finalFund.div(1000));
          coinAmount = finalFund.div(close[i-1]);
          finalFund =new Big(0);
          stopLoss=close[i-1].minus(close[i-1].minus(open[i-1]).times(slMultiplier));
          takeProfit=close[i-1].plus(close[i-1].minus(open[i-1]).times(tpMultiplier));
        }
      }
      if (engulf === "bearish") {
        if (open[i] < ema200Result[i] && rsiResult[i] < 50) {
          //bearish senaryosu buraya
          openPositions = 1;
          positionType = "short";
          totalOrder++;
          //komisyon kesimi
          finalFund=finalFund.minus(finalFund.div(1000));
          shortHelper=finalFund;
          coinAmount =finalFund.div(close[i-1]);
          finalFund = new Big(0);
          stopLoss=close[i-1].plus(open[i-1].minus(close[i-1]).times(slMultiplier));
          takeProfit= close[i-1].minus(open[i-1].minus(close[i-1]).times(tpMultiplier));
        }
      }
    } else if (openPositions === 1) {
      //satım için kontrol ediyor
      if (positionType === "long") {
        if (high[i] >= takeProfit) {
          let amount =takeProfit.times(coinAmount);
          //komisyon kesimi
          let withFee =amount.minus(amount.div(1000)); 
          finalFund = finalFund.plus(withFee);
          coinAmount =0;
          successLongOrder++;
          openPositions = 0;
        } else if (low[i] <= stopLoss) {
          let amount = stopLoss.times(coinAmount);
          //komisyon kesimi
          let withFee = amount.minus(amount.div(1000));
          finalFund = finalFund.plus(withFee);
          coinAmount = 0;
          failedLongOrder++;
          openPositions = 0;
        }
      }
      if (positionType === "short") {
        if (low[i] <= takeProfit) {
          let amount = takeProfit.times(coinAmount);
          //komisyon kesimi
          let withFee = amount.plus(amount.div(1000));
          finalFund = shortHelper.plus(shortHelper.minus(withFee));
          coinAmount = 0;
          successShortOrder++;
          openPositions = 0;
        } else if (high[i] >= stopLoss) {
          let amount = stopLoss.times(coinAmount);
          //komisyon kesimi
          let withFee = amount.plus(amount.div(1000));
          finalFund=shortHelper.plus(shortHelper.minus(withFee));
          coinAmount = 0;
          failedShortOrder++;
          openPositions = 0;
        }
      }
    }
  }
 
  console.log(`openposition ${openPositions}`);
  let percentage =finalFund.minus(startFund).div(startFund);

  console.log(`
              start Fund ${startFund}
              final Fund ${finalFund.toFixed()} 
              total Order ${totalOrder}
              total successful orders ${successLongOrder + successShortOrder}
              total failed orders ${failedShortOrder + failedLongOrder}
              successful  long orders ${successLongOrder}
              failed long orders ${failedLongOrder}
              successful short orders ${successShortOrder}
              failed short orders ${failedShortOrder}
              percentage ${percentage.toFixed()}
              `);
};

