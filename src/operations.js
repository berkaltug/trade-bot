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
    let result = await bybit.fetchOHLCV(pair, interval, since, undefined, {
      recvWindow: 20000,
    }); //limit undefined gönder belirtmeye gerek yok
    const lastPrice = last(result)[4];
    // result.pop(); // don't look current candle
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

exports.trade = async ({
  pair,
  ema9,
  ema14,
  ema26,
  macdCrossUps,
  macdCrossDowns,
  atr,
  rsi,
  mfi
}) => {
  try {
    const bybitPair = pair.replace("/", "");
    const orders = await getOrders(bybitPair);
    const positions = await getPositions(bybitPair);
    if (positions.result[0].size == 0 || positions.result[1].size == 0) {
      if (orders.result.length && orders.result.length > 0) {
        //pozisyon yok ama filled olmayan order beklemede demek
        await cancelAllOrders(bybitPair);
      }
      let crossUp, crossDown;
      const reverseCrossUps = macdCrossUps.reverse();
      const reverseCrossDowns = macdCrossDowns.reverse();
      for (let i = 0; i < 5; i++) {
        if (reverseCrossUps[i]) {
          crossUp = true;
          crossDown = false;
        }
        if (reverseCrossDowns[i]) {
          crossDown = true;
          crossUp = false;
        }
      }
      if (crossUp && last(rsi) > 50 && last(mfi) > 50) {
        console.log("buying long");
        const moneyResponse = await bybit.fetchBalance();
        const money = new Big(moneyResponse.USDT.free);
        const buyMoney = money.times(99).div(100);
        const lastPrice = new Big(await this.getLastPrice(pair));
        const amount = buyMoney.div(lastPrice);
        const ATR = new Big(last(atr));
        const stop_loss = lastPrice.minus(ATR.times(2.2));
        const take_profit = lastPrice.plus(ATR.times(2));
        const params = {
          stop_loss: stop_loss.toFixed(2),
          take_profit: take_profit.toFixed(2),
        };
        bybit.createOrder(
          pair,
          "market",
          "buy",
          amount.toFixed(4, Big.roundDown),
          null,//price can be null on market
          params
        );
      } else if (crossDown && last(rsi) < 50 && last(mfi) < 50) {
        console.log("buying short");
        const moneyResponse = await bybit.fetchBalance();
        const money = new Big(moneyResponse.USDT.free);
        const buyMoney = money.times(99).div(100);
        const lastPrice = new Big(await this.getLastPrice(pair));
        const amount = buyMoney.div(lastPrice);
        const ATR = new Big(last(atr));
        const stop_loss = lastPrice.plus(ATR.times(2.2));
        const take_profit = lastPrice.minus(ATR.times(2));
        const params = {
          stop_loss: stop_loss.toFixed(2),
          take_profit: take_profit.toFixed(2),
        };
        bybit.createOrder(
          pair,
          "market",
          "sell",
          amount.toFixed(4, Big.roundDown),
          null,//price can be null on market
          params
        );
      }
    }
  } catch (error) {
    console.error(error);
  }
};

exports.trade2 = async ({ pair, atr, crossDowns, crossUps, ema14 }) => {
  try {
    const bybitPair = pair.replace("/", "");
    const orders = await getOrders(bybitPair);
    const positions = await getPositions(bybitPair);

    if (positions.result[0].size == 0 || positions.result[1].size == 0) {
      if (orders.result.length && orders.result.length > 0) {
        //pozisyon yok ama filled olmayan order beklemede demek
        await cancelAllOrders(bybitPair);
      }
      const lastPrice = new Big(await this.getLastPrice(pair));
      if (last(crossUps) || crossUps[crossUps.length - 2]) {
        if (lastPrice < last(ema14)) {
          console.log("buying long");
          const moneyResponse = await bybit.fetchBalance();
          const money = new Big(moneyResponse.USDT.free);
          const buyMoney = money.times(99).div(100);
          const amount = buyMoney.div(lastPrice);
          const ATR = new Big(last(atr));
          const stop_loss = lastPrice.minus(ATR.times(2.5));
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
      } else if (last(crossDowns) || crossDowns[crossDowns.length - 2]) {
        if (lastPrice > last(ema14)) {
          console.log("buying short");
          const moneyResponse = await bybit.fetchBalance();
          const money = new Big(moneyResponse.USDT.free);
          const buyMoney = money.times(99).div(100);
          const amount = buyMoney.div(lastPrice);
          const ATR = new Big(last(atr));
          const stop_loss = lastPrice.plus(ATR.times(2.5));
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
