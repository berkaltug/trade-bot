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
const { intervalToMs } = require("./rsiEmaEngulf");
const talib = require("talib");
exports.stochMacdRsi = async ({
  pair,
  interval,
  startFund,
  startDate,
  endDate = new Date(),
}) => {
  let finalFund = startFund;
  let takeProfit = mathjs.bignumber(0);
  let stopLoss = mathjs.bignumber(0);
  let openPositions = 0;
  let totalOrder = 0;
  let successOrder = 0;
  let failedOrder = 0;
  let coinAmount = mathjs.bignumber(0);
  let positionType;
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
      open.push(mathjs.bignumber(value[1]));
      high.push(mathjs.bignumber(value[2]));
      low.push(mathjs.bignumber(value[3]));
      close.push(mathjs.bignumber(value[4]));
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

  const stochK = _.map(stoch, (value, index) => index>1 && mathjs.bignumber(value.k));
  const stochD = _.map(stoch, (value, index) => index>1 && mathjs.bignumber(value.d));
  const stochCrossUps = CrossUp.calculate({ lineA: stochK, lineB: stochD });
  const stochCrossDowns = CrossDown.calculate({ lineA: stochK, lineB: stochD });
  const macdArr = _.map(macd.result.outMACD, (value, index) => mathjs.bignumber(value));
  const macdSignal = _.map(macd.result.outMACDSignal, (value, index) =>
    mathjs.bignumber(value)
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
              finalFund = mathjs.subtract(
                finalFund,
                mathjs.divide(finalFund, mathjs.bignumber(1000))
              );
              coinAmount = mathjs.divide(finalFund, open[i]);
              finalFund = mathjs.mod(finalFund, open[i]);
              //son 5 mumun en düşüğü bulunuyor
              const lowestArr = [];
              for (let k = 1; k < 6; k++) {
                lowestArr.push(low[i - k]);
              }
              stopLoss = mathjs.min(lowestArr);
              takeProfit = mathjs.sum(
                open[i],
                mathjs.multiply(
                  mathjs.subtract(open[i], stopLoss),
                  mathjs.bignumber(1.5)
                )
              );
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
              finalFund = mathjs.subtract(
                finalFund,
                mathjs.divide(finalFund, mathjs.bignumber(1000))
              );
              coinAmount = mathjs.divide(finalFund, open[i]);
              finalFund = mathjs.mod(finalFund, open[i]);
              //son 5 mumun en düşüğü bulunuyor
              const highestArr = [];
              for (let k = 1; k < 6; k++) {
                highestArr.push(high[i - k]);
              }
              stopLoss = mathjs.max(highestArr);
              takeProfit = mathjs.subtract(
                open[i],
                mathjs.multiply(
                  mathjs.subtract(stopLoss, open[i]),
                  mathjs.bignumber(1.5)
                )
              );
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
        if (high[i] > takeProfit) {
          let amount = mathjs.multiply(coinAmount, stopLoss);
          let withFee = mathjs.subtract(
            amount,
            mathjs.divide(amount, mathjs.bignumber(1000))
          );
          finalFund = mathjs.sum(finalFund, withFee);
          coinAmount = mathjs.bignumber(0);
          successOrder++;
          openPositions = 0;
        } else if (low[i] < stopLoss) {
          let amount = mathjs.multiply(coinAmount, stopLoss);
          let withFee = mathjs.subtract(
            amount,
            mathjs.divide(amount, mathjs.bignumber(1000))
          );
          finalFund = mathjs.sum(finalFund, withFee);
          coinAmount = mathjs.bignumber(0);
          failedOrder++;
          openPositions = 0;
        }
      }
      if (positionType === "short") {
        if (low[i] < takeProfit) {
          console.log("++++");
          let amount = mathjs.multiply(coinAmount, takeProfit);
          let withFee = mathjs.subtract(
            amount,
            mathjs.divide(amount, mathjs.bignumber(1000))
          );
          finalFund=mathjs.sum(finalFund,mathjs.subtract(finalFund,withFee));
          coinAmount = mathjs.bignumber(0);
          successOrder++;
          openPositions = 0;
        } else if (high[i] > stopLoss) {
          console.log("----");
          let amount = mathjs.multiply(coinAmount, stopLoss);
          let withFee = mathjs.subtract(
            amount,
            mathjs.divide(amount, mathjs.bignumber(1000))
          );
          finalFund=mathjs.sum(finalFund,mathjs.subtract(finalFund,withFee));
          coinAmount = mathjs.bignumber(0);
          failedOrder++;
          openPositions = 0;
        }
      }
    }
  }
  let percentage = mathjs.divide(
    mathjs.subtract(finalFund, startFund),
    startFund
  );
  console.log(`
              start Fund ${startFund}
              final Fund ${mathjs.format(finalFund, {
                notation: "fixed",
                precision: 4,
              })} 
              total Order ${totalOrder}
              successful orders ${successOrder}
              failed orders ${failedOrder}
              percentage ${mathjs.format(percentage, {
                notation: "fixed",
                precision: 4,
              })}
              `);
};
