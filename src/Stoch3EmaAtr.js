const {
  CrossDown,
  CrossUp,
  StochasticRSI,
  EMA,
  ATR,
  Stochastic,
} = require("technicalindicators");
const _ = require("lodash");
const talib = require("talib");
const tulind = require("tulind");
const Big = require("big.js");
const { fetchAndPrepareValues,fetcHighPeriod } = require("./backTestPreperation");
const {
  buyLong,
  buyShort,
  sellOperation,
  SellOperationNoCommission,
  buyLongNoCommission,
  buyShortNoCommission,
} = require("./buySellOperations");
const { trendDirection } = require("./technicAnalysis");
const { intervalToMinute, fillArrayRepating } = require("./utils");


exports.Stoch3EmaAtr = async ({
  pair,
  interval,
  highInterval,
  startFund,
  startDate,
  endDate = new Date(),
  tpMultiplier,
  slMultiplier,
}) => {
  const dataset = {};
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

  let ema8 = EMA.calculate({
    period: 8,
    values: dataset.close.map((x) => x.toNumber()),
  });
  const ema14 = EMA.calculate({
    period: 14,
    values: dataset.close.map((x) => x.toNumber()),
  });
  const ema50 = EMA.calculate({
    period: 50,
    values: dataset.close.map((x) => x.toNumber()),
  });
  const stoch = Stochastic.calculate({
    high: dataset.high.map((x) => x.toNumber()),
    low: dataset.low.map((x) => x.toNumber()),
    close: dataset.close.map((x) => x.toNumber()),
    period: 14,
    signalPeriod: 3,
  });
  let atr = ATR.calculate({
    high: dataset.high.map((x) => x.toNumber()),
    low: dataset.low.map((x) => x.toNumber()),
    close: dataset.close.map((x) => x.toNumber()),
    period: 14,
  });
  let ema200HighPeriod=EMA.calculate({
    values:dataset.highClose.map(x=>x.toNumber()),
    period:200
  });
  atr = atr.map((x) => new Big(x));
  const stochK = _.map(stoch, (value, index) => index > 1 && value.k);
  const stochD = _.map(stoch, (value, index) => index > 1 && value.d);
  const stochCrossUps = CrossUp.calculate({ lineA: stochK, lineB: stochD });
  const stochCrossDowns = CrossDown.calculate({ lineA: stochK, lineB: stochD });
  const repeatAmount=intervalToMinute(highInterval)/intervalToMinute(interval);
  const repeatedEma200= fillArrayRepating(ema200HighPeriod,repeatAmount);
  let sliceStart = 0;
  let sliceEnd = 200;
  for (let i = 200*repeatAmount; i < dataset.close.length; i++) {
    const direction=trendDirection(repeatedEma200.slice(sliceStart,sliceEnd));
    if (dataset.openPositions === 0 && dataset.finalFund > 0) {
      if (ema8[i] > ema14[i] && ema14[i] > ema50[i] ) {
        if (
          (stochCrossUps[i - 2] ||stochCrossUps[i - 1] || stochCrossUps[i]) &&
          stochK[i] > 50 &&
          stochD[i] > 50
        ) {
          buyLong(dataset, i);
          dataset.takeProfit = dataset.close[i - 1].plus(
            atr[i].times(tpMultiplier)
          );
          dataset.stopLoss = dataset.close[i - 1].minus(
            atr[i].times(slMultiplier)
          );
        }
      } else if (ema8[i] < ema14[i] && ema14[i] < ema50[i] ) {
        if (
          (stochCrossDowns[i - 2] ||stochCrossDowns[i - 1] || stochCrossDowns[i]) &&
          stochK[i] < 50 &&
          stochD[i] < 50
        ) {
          buyShort(dataset, i);
          dataset.takeProfit = dataset.close[i - 1].minus(
            atr[i].times(tpMultiplier)
          );
          dataset.stopLoss = dataset.close[i - 1].plus(
            atr[i].times(slMultiplier)
          );
        }
      }
    }
    if (dataset.openPositions === 1) {
      sellOperation(dataset, i);
    }

    sliceStart++;
    sliceEnd++;
  }

  if (dataset.openPositions == 1) {
    dataset.finalFund = dataset.coinAmount.times(
      dataset.close[dataset.close.length - 1]
    );
  }

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
  // stoch rsi'ların hiçbiri düzgün çalışıyor mu emin değiliz.
  // const stochRsi=StochasticRSI.calculate({
  //     values:dataset.close.map((x)=>x.toNumber()),
  //     rsiPeriod:14,
  //     stochasticPeriod:14,
  //     kPeriod:3,
  //     dPeriod:3
  // })
  // const talibStochRsi=talib.execute({
  //     name:"STOCHRSI",
  //     startIdx:0,
  //     endIdx:dataset.close.length-1,
  //     inReal:dataset.close,
  //     optInTimePeriod:14,
  //     optInFastK_Period:3,
  //     optInFastD_Period:3,
  //     optInFastD_MAType:0
  // });
  // const tulindStochRsi=tulind.indicators.stochrsi.indicator([dataset.close.map(x=>x.toNumber())],
  // [14],(err,result)=>{
  //     console.log(result);
  // })
};
