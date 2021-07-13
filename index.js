const moment = require("moment");
const express = require('express');
const app=express();
const port=process.env.PORT || 3000;
const { getLastPrice, getBybitPrices, trade, trade2 } = require("./src/operations");
const { calculateIndicators, calculateIndicators2 } = require("./src/technicAnalysis");
const { default: Big } = require("big.js");


const testnet = () => {
  const timeInterval=15,higherReferencePeriod=30;
  setInterval(async () => {
    console.log("ticking... " + moment().format("DD-MM-YYYY HH:mm"))
    let result = await getBybitPrices(
      "ETH/USDT",
      timeInterval+"m",
      moment().subtract(200*timeInterval, "minutes")
    );
    let result30min = await getBybitPrices(
      "ETH/USDT",
      higherReferencePeriod + "m",
      moment().subtract(200*30, "minutes")
    );
    let result30min2nd = await getBybitPrices(
      "ETH/USDT",
      higherReferencePeriod + "m",
      moment().subtract(200*30*2, "minutes")
    );
    let { ema9,ema14,ema26, macdCrossUps, macdCrossDowns, atr ,rsi,psar,ema200HighPeriod,direction} =
      calculateIndicators(result,result30min,result30min2nd);
    await trade({
      pair: "ETH/USDT",
      ema9,
      ema14,
      ema26,
      macdCrossUps,
      macdCrossDowns,
      rsi,
      atr,
      psar,
      ema200HighPeriod,
      direction
    });
  }, 60000*5);
};

app.get('/',(req,res)=>{
  res.send("bot is working...");
})
app.listen(port,()=>{
  console.log(`bot started on port ${port}`);
  testnet();
})
