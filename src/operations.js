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
Big.DP = 2;
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
  // setTimeout(() => {

  // }, 50);
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

exports.getBybitPrices = async (pair, interval, since) => {
  try {
    let result = await bybit.fetchOHLCV(pair, interval, since,undefined,{recvWindow:20000});//limit undefined gönder belirtmeye gerek yok
    const lastPrice = last(result)[4];
    result.pop(); // don't look current candle
    return result;
  } catch (e) {
    console.error(e);
  }
};
exports.getLastPrice = async (pair) => {
  let now1 = Date.now();
  try {
    const ticker = await bybit.fetchTicker(pair,{recvWindow:20000});
    return ticker.last;
  } catch (e) {
    console.error("error while fetching last price", e);
  }
};

exports.trade = async ({
  pair,
  ema8,
  ema14,
  ema50,
  stochCrossUps,
  stochCrossDowns,
  stochK,
  stochD,
  atr,
}) => {
  try {
    const bybitPair = pair.replace("/", "");
    const orders = await getOrders(bybitPair);
    const positions = await getPositions(bybitPair);
    if (positions.result[0].size==0 || positions.result[1].size==0) {
      if (orders.result.length && orders.result.length > 0) {
        //pozisyon yok ama filled olmayan order beklemede demek
        await cancelAllOrders(bybitPair);
      }
      if (last(ema8) > last(ema14) && last(ema14) > last(ema50)) {
        console.log(" long emalar sağlandı");
        if (
          (last(stochCrossUps) || stochCrossUps[stochCrossUps.length - 2]) &&
          last(stochK) < 50 &&
          last(stochD) < 50
        ) {
          console.log("buying long");
          const moneyResponse = await bybit.fetchBalance();
          const money=new Big(moneyResponse.USDT.free);
          const buyMoney = money.times(99).div(100);
          const lastPrice = new Big(await this.getLastPrice(pair));
          const amount = buyMoney.div(lastPrice);
          const ATR = new Big(last(atr));
          const stop_loss = lastPrice.minus(ATR.times(1.7));
          const take_profit = lastPrice.plus(ATR.times(2));
          const params = {
            stop_loss: stop_loss.toFixed(2),
            take_profit: take_profit.toFixed(2),
          };
          bybit.createOrder(
            pair,
            "limit",
            "buy",
            amount.toFixed(2),
            lastPrice.toFixed(2),
            params
          );
        }
      } else if (last(ema8) < last(ema14) && last(ema14) < last(ema50)) {
        console.log("short emalar sağlandı");
        if (
          (last(stochCrossDowns) ||
            stochCrossDowns[stochCrossDowns.length - 1]) &&
          last(stochK) > 50 &&
          last(stochD) > 50
        ) {
          console.log("buying short");
          const moneyResponse =await bybit.fetchBalance();
          const money=new Big(moneyResponse.USDT.free);
          const buyMoney = money.times(99).div(100);
          const lastPrice = new Big(await this.getLastPrice(pair));
          const amount = buyMoney.div(lastPrice);
          const ATR = new Big(last(atr));
          const stop_loss = lastPrice.plus(ATR.times(1.7));
          const take_profit = lastPrice.minus(ATR.times(2));
          const params = {
            stop_loss: stop_loss.toFixed(2),
            take_profit: take_profit.toFixed(2),
          };
          bybit.createOrder(
            pair,
            "limit",
            "sell",
            amount.toFixed(2),
            lastPrice.toFixed(2),
            params
          );
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
};
