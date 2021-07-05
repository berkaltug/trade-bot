const moment = require("moment");
const express = require('express');
const app=express();
const port=process.env.PORT || 3000;
const { getLastPrice, getBybitPrices, trade, trade2 } = require("./src/operations");
const { calculateIndicators, calculateIndicators2 } = require("./src/technicAnalysis");
const { default: Big } = require("big.js");


const testnet = () => {
  const timeInterval=1;
  setInterval(async () => {
    console.log("ticking... " + moment().format("DD-MM-YYYY HH:mm"))
    let result = await getBybitPrices(
      "BTC/USDT",
      timeInterval+"m",
      moment().subtract(200*timeInterval, "minutes")
    );
    let result30min = await getBybitPrices(
      "BTC/USDT",
      "30m",
      moment().subtract(200*30, "minutes")
    );
    let { ema9,ema14,ema26, macdCrossUps, macdCrossDowns, atr ,rsi,psar,ema200HighPeriod} =
      calculateIndicators(result,result30min);
    await trade({
      pair: "BTC/USDT",
      ema9,
      ema14,
      ema26,
      macdCrossUps,
      macdCrossDowns,
      rsi,
      atr,
      psar,
      ema200HighPeriod
    });
  }, 60000*timeInterval);
};

app.get('/',(req,res)=>{
  res.send("bot is working...");
})
app.listen(port,()=>{
  console.log(`bot started on port ${port}`);
  testnet();
})


