const moment = require("moment");
const express = require('express');
const app=express();
const port=process.env.PORT || 3000;
const { getLastPrice, getBybitPrices, trade, trade2 } = require("./src/operations");
const { calculateIndicators, calculateIndicators2 } = require("./src/technicAnalysis");
const { default: Big } = require("big.js");


const testnet = () => {
  const timeInterval=1,higherReferencePeriod=5;
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
      moment().subtract(200*higherReferencePeriod, "minutes")
    );
    let result30min2nd = await getBybitPrices(
      "ETH/USDT",
      higherReferencePeriod + "m",
      moment().subtract(200*higherReferencePeriod*2, "minutes")
    );
    let {  ema8,
      ema14,
      ema50,
      stochK,
      stochD,
      stochCrossUps,
      stochCrossDowns,
      atr} =
      calculateIndicators(result,result30min,result30min2nd);
    await trade({
      pair: "ETH/USDT",
      ema8,
      ema14,
      ema50,
      stochK,
      stochD,
      stochCrossUps,
      stochCrossDowns,
      atr,
      slMultiplier:2,
      tpMultiplier:4
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
