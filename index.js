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
  MFI,
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
const { default: Big } = require("big.js");


const testnet = () => {
  setInterval(async () => {
    console.log("ticking... " + moment().format("DD-MM-YYYY HH:mm"))
    let result = await getBybitPrices(
      "BTC/USDT",
      "5m",
      moment().subtract(200*5, "minutes")
    );
    let { ema9,ema14,ema26, macdCrossUps, macdCrossDowns, atr ,rsi,mfi} =
      calculateIndicators(result);
    await trade({
      pair: "BTC/USDT",
      ema9,
      ema14,
      ema26,
      macdCrossUps,
      macdCrossDowns,
      rsi,
      atr,
      mfi
    });
  }, 60000*5);
};

const rsiEmaRealTest=()=>{
  setTimeout(async()=>{
    const result = await getBybitPrices(
      "ETH/USDT",
      "1m",
      moment().subtract(200, "minutes")
    );
    const {ema14,crossUps,crossDowns,atr}=calculateIndicators2(result);
    await trade2({
      pair:"ETH/USDT",
      atr,
      ema14,
      crossUps,
      crossDowns,
    })
  },60000)
}
app.get('/',(req,res)=>{
  res.send("bot is working...");
})
app.listen(port,()=>{
  console.log(`bot started on port ${port}`);
  testnet();
})

