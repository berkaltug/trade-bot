const binance = require("./binance");
const _ = require("lodash");
const bybit = require("./bybit");
const {
  getPositions,
  getOrders,
  cancelAllOrders,
} = require("./requests/nativeRequests");
const { last } = require("./utils.js");
const Big = require("big.js");
Big.DP = 4;
exports.getCurrentBalance = () => {
  console.log("Your current balances...");
  binance.balance((error, balances) => {
    error && console.log(error);
    _.forEach(balances, (value, key) => {
      if (value.available != 0) {
        console.log(`${key} = ${value.available}`);
      }
    });
  });
};

exports.getUSDTPairs = async () => {
  let prices = await binance.prices();
  const usdtPairs = _.filter(Object.keys(prices), (value, index) => {
    return value.endsWith("USDT");
  });
  return usdtPairs;
};
exports.getCoinPrices = ({ pair, interval, limit, endDate }) => {
  setTimeout(() => {

  }, 250);
  return new Promise((resolve, reject) => {
    binance.candlesticks(
      pair,
      interval,
      (error, ticks, symbol) => {
        if (error) {
          reject(error);
        } else {
          resolve(ticks);
        }
      },
      { limit, endTime: endDate }
    );
  });
};

exports.getBybitPrices = async (pair, interval, since=undefined) => {
  try {
    let result = await bybit.fetchOHLCV(pair, interval, since, undefined, {
      recvWindow: 20000,
    }); //limit undefined gönder belirtmeye gerek yok
    const lastPrice = last(result)[4];
    return result;
  } catch (e) {
    console.error(e);
  }
};
exports.getLastPrice = async (pair) => {
  let now1 = Date.now();
  try {
    const ticker = await bybit.fetchTicker(pair, { recvWindow: 20000 });
    return ticker.last;
  } catch (e) {
    console.error("error while fetching last price", e);
  }
};


