const mathjs = require("./mathConfig");
const { getCoinPrices } = require("./operations");
const {
  Stochastic,
  MACD,
  RSI,
  CrossUp,
  CrossDown,
  Highest,
} = require("technicalindicators");
const _ = require("lodash");
const talib = require("talib");
const Big=require("big.js");
const BigNumber = require("bignumber.js");
const {intervalToMs} = require("./utils");
exports.stochMacdRsi = async ({
  pair,
  interval,
  startFund,
  startDate,
  endDate = new Date(),
}) => {
  let finalFund = startFund;
  let takeProfit = 0;
  let stopLoss = 0;
  let openPositions = 0;
  let totalOrder = 0;
  let successOrder = 0;
  let failedOrder = 0;
  let coinAmount = 0;
  let positionType;
  let shortHelper=new Big(0);
  const startMs = startDate?.getTime();
  const endMs = endDate?.getTime();
  const dividerMs = intervalToMs(interval);
  const candlesticks = (endMs - startMs) / dividerMs;
  const limit = 1000;
  const requestCount = mathjs.ceil(candlesticks / limit);
  let high = [];
  let low = [];
  let close = [];
  let open = [];
  let ticksArray = [];
  let lastDateMs = startMs + limit * dividerMs;
  console.log(`candlesticks ${candlesticks}`);
  console.log(
    ` startDate ${startDate} endDate ${endDate} requestCount ${requestCount} `
  );
  console.log("fetching prices...");
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
    lastDateMs += limit * dividerMs;
  }
  _.forEach(ticksArray, (ticks, index) => {
    _.forEach(ticks, (value, index) => {
      open.push(new Big(value[1]));
      high.push(new Big(value[2]));
      low.push(new Big(value[3]));
      close.push(new Big(value[4]));
    });
  });
  const rsi = RSI.calculate({ values: close, period: 14 });
  let macd = talib.execute({
    name: "MACD",
    startIdx: 0,
    endIdx: close.length - 1,
    inReal: close,
    optInFastPeriod:12,
    optInSlowPeriod:26,
    optInSignalPeriod:9
  });
  const stoch = Stochastic.calculate({
    high,
    low,
    close,
    period: 14,
    signalPeriod: 3,
  });

  const stochK = _.map(stoch, (value, index) => index>1 && new Big(value.k));
  const stochD = _.map(stoch, (value, index) => index>1 && new Big(value.d));
  const stochCrossUps = CrossUp.calculate({ lineA: stochK, lineB: stochD });
  const stochCrossDowns = CrossDown.calculate({ lineA: stochK, lineB: stochD });
  const macdArr = _.map(macd.result.outMACD, (value, index) => new Big(value));
  const macdSignal = _.map(macd.result.outMACDSignal, (value, index) =>
    new Big(value)
  );
  const macdCrossUps = CrossUp.calculate({ lineA: macdArr, lineB: macdSignal });
  const macdCrossDowns = CrossDown.calculate({
    lineA: macdArr,
    lineB: macdSignal,
  });
  let stochCrossOversoldIdx = null;
  let stochCrossOverboughtIdx = null;
  for (let i = 25; i < close.length; i++) {
    if (openPositions == 0 && finalFund != 0) {
      if (stochK[i] < 20 && stochD[i] < 20 && stochCrossUps[i]) {
        stochCrossOversoldIdx = i;
      }
      if (stochK[i] > 80 && stochD[i] > 80 && stochCrossDowns[i]) {
        stochCrossOverboughtIdx = i;
      }
      if (
        stochCrossOversoldIdx &&
        !stochCrossOverboughtIdx &&
        stochK[i] < 80 &&
        stochD[i] < 80
      ) {
        if (rsi[i] > 50) {
          for (let j = stochCrossOversoldIdx; j <= i; j++) {
            if (macdCrossUps[j]) {
              //buy long position sondan 5 mumun en düşüğü stoploss , 1.5 katı tp
              finalFund =finalFund.minus(finalFund.div(1000))
              coinAmount =finalFund.div(open[i]);
              finalFund = 0;
              //son 5 mumun en düşüğü bulunuyor
              const lowestArr = [];
              for (let k = 1; k < 6; k++) {
                lowestArr.push(low[i - k].toFixed());
              }
              console.log(lowestArr);
              stopLoss = BigNumber.min(lowestArr);
              takeProfit = open[i].plus(open[i].minus(stopLoss).times(1.5))
              totalOrder++;
              positionType = "long";
              openPositions = 1;
            }
          }
        }
      } else {
        stochCrossOversoldIdx = null;
      }
      if (
        !stochCrossOversoldIdx &&
        stochCrossOverboughtIdx &&
        stochK[i] > 80 &&
        stochD[i] > 80
      ) {
        if (rsi[i] < 50) {
          //rsi 50 yi geçince stoch crossundan o ana kadar macd crossu bakıcaz
          for (let j = stochCrossOverboughtIdx; j <= i; j++) {
            if (macdCrossDowns[j]) {
              //buy short position son 5 mumun en düşüğü stopLoss , 1.5 katı tp
              finalFund = finalFund.minus(finalFund.div(1000)); 
              shortHelper=finalFund;
              coinAmount =finalFund.div(open[i]); 
              finalFund = 0
              //son 5 mumun en düşüğü bulunuyor
              const highestArr = [];
              for (let k = 1; k < 6; k++) {
                highestArr.push(high[i - k].toFixed());
              }
              console.log(highestArr);
              stopLoss = BigNumber.max(highestArr);
              takeProfit = open[i].minus(stopLoss.minus(open[i]).times(1.5));
              totalOrder++;
              positionType = "short";
              openPositions = 1;
            }
          }
        }
      } else {
        stochCrossOverboughtIdx = null;
      }
    }
    if (openPositions == 1) {
      if (positionType === "long") {
        if (high[i] >= takeProfit) {
          let amount = takeProfit.times(coinAmount);
          let withFee =amount.minus(amount.div(1000)); 
          finalFund = finalFund.plus(withFee);
          coinAmount = 0;
          successOrder++;
          openPositions = 0;
        } else if (low[i] <= stopLoss) {
          let amount = stopLoss.times(coinAmount); 
          let withFee = amount.minus(amount.div(1000)); 
          finalFund = finalFund.plus(withFee);
          coinAmount = 0;
          failedOrder++;
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
          successOrder++;
          openPositions = 0;
        } else if (high[i] >= stopLoss) {
          let amount = stopLoss.times(coinAmount); mathjs.multiply(coinAmount, stopLoss);
          let withFee = amount.plus(amount.div(1000));
          finalFund = shortHelper.plus(shortHelper.minus(withFee));
          coinAmount = 0;
          failedOrder++;
          openPositions = 0;
        }
      }
    }
  }
  let percentage = finalFund.minus(startFund).div(startFund);
  console.log(`
              start Fund ${startFund}
              final Fund ${finalFund.toFixed()} 
              total Order ${totalOrder}
              successful orders ${successOrder}
              failed orders ${failedOrder}
              percentage ${percentage.toFixed()}
              `);
};
