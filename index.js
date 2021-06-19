const bybit = require("./src/bybit");
const moment = require("moment");
const talib = require("talib");
const {
  CrossDown,
  CrossUp,
  StochasticRSI,
  EMA,
  ATR,
  Stochastic,
} = require("technicalindicators");
const tulind = require("tulind");
const express = require('express');
const app=express();
const dotenv =require('dotenv');
const port=process.env.PORT || 3000;
const {
  getPositions,
  getOrders,
  cancelAllOrders,
} = require("./src/requests/nativeRequests");
const { getLastPrice, getBybitPrices, trade, trade2 } = require("./src/operations");
const { calculateIndicators, calculateIndicators2 } = require("./src/technicAnalysis");


const testnet = () => {
  setInterval(async () => {
    let result = await getBybitPrices(
      "ETH/USDT",
      "5m",
      moment().subtract(1000, "minutes")
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
  }, 60000*5);
};

const rsiEmaRealTest=()=>{
  setTimeout(async()=>{
    const result = await getBybitPrices(
      "ETH/USDT",
      "5m",
      moment().subtract(1000, "minutes")
    );
    const {ema14,crossUps,crossDowns,atr}=calculateIndicators2(result);
    await trade2({
      pair:"ETH/USDT",
      atr,
      ema14,
      crossUps,
      crossDowns
    })
  },60000*5)
}
app.listen(port,()=>{
  console.log(`bot started on port ${port}`);
  rsiEmaRealTest();
})