const Big = require('big.js');
Big.DP = 10;
const {getCoinPrices} = require('./operations');
const { intervalToMs } = require("./utils");
const _ =require('lodash');
exports.fetchAndPrepareValues = async (
  pair,
  interval,
  startFund,
  startDate,
  endDate = new Date(),
  dataset
) => {
  dataset.finalFund = startFund;
  dataset.takeProfit = 0;
  dataset.stopLoss = 0;
  dataset.openPositions = 0;
  dataset.totalOrder = 0;
  dataset.successLongOrder = 0;
  dataset.successShortOrder = 0;
  dataset.failedLongOrder = 0;
  dataset.failedShortOrder = 0;
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
      if(new Date(lastDateMs)>new Date()){
        lastDateMs=endDate.getTime();
      }
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
};
