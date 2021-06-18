const bybit = require("./src/bybit");
const moment = require("moment");
const talib = require("talib");
const http = require('http');
const {
  CrossDown,
  CrossUp,
  StochasticRSI,
  EMA,
  ATR,
  Stochastic,
} = require("technicalindicators");
const tulind = require("tulind");
const {
  getPositions,
  getOrders,
  cancelAllOrders,
} = require("./src/requests/nativeRequests");
const { getLastPrice, getBybitPrices, trade } = require("./src/operations");
const { calculateIndicators } = require("./src/technicAnalysis");

const testnet = () => {
  setInterval(async () => {
    let result = await getBybitPrices(
      "ETH/USDT",
      "1m",
      moment().subtract(200, "minutes")
    );
    let { ema8, ema14, ema50,stochK,stochD, stochCrossUps, stochCrossDowns, atr } =
      calculateIndicators(result);
    await trade({
      pair: "ETH/USDT",
      ema8,
      ema14,
      ema50,
      stochCrossUps,
      stochCrossDowns,
      stochK,
      stochD,
      atr,
    });
  }, 60000);
};

testnet();