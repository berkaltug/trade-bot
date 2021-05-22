const binance = require("./binance");
const _ = require("lodash");
const { values } = require("lodash");

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
  return new Promise((resolve, reject) => {
    setTimeout(() => {}, 250); // binance apimiz bloklanmasın diye acık bekletiyoz
    binance.candlesticks(
      pair,
      interval,
      (error, ticks, symbol) => {
        if (error) {
          reject(error?.body);
        } else {
          resolve(ticks);
        }
      },
      { limit, endTime: endDate }
    );
  });
};
