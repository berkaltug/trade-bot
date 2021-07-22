const dotenv = require("dotenv").config();
const binance = require("./src/binance");
const operations = require("./src/operations");
const talib = require("talib");
const util = require("util");
const { getCoinPrices } = require("./src/operations");
const { engulfingCheck } = require("./src/technicAnalysis");
const _ = require("lodash");
const mathjs = require("./src/mathConfig");
const { testRsiEmaEngulf } = require("./src/rsiEmaEngulf");
const { stochMacdRsi } = require("./src/stochMacdRsi");
const Big = require("big.js");
const { Stoch3EmaAtr } = require("./src/Stoch3EmaAtr");
const { rsiEma } = require("./src/rsiEma");
const { parSarMacdEma } = require("./src/parSarMacdEma");
Big.DP = 10;

const test1 = async () => {
  
    await testRsiEmaEngulf({
      pair: "ETHUSDT",
      interval: "1m",
      startFund:new Big(200),
      startDate: new Date("2020-12-01T00:00:00"),
      endDate: new Date("2020-12-30T00:00:00"),
      tpMultiplier:3,
      slMultiplier:2.7
    });
  
};

const test2= async()=>{
  await stochMacdRsi({
      pair: "ETHUSDT",
      interval: "15m",
      startFund:new Big(200),
      startDate: new Date("2020-01-01T00:00:00"),
      endDate: new Date("2020-04-01T00:00:00"),
  });
}

test3=async()=>{
  let now1=Date.now()
  await Stoch3EmaAtr({
    pair: "ETHUSDT",
      interval: "1h",
      highInterval:"4h",
      startFund:new Big(200),
      startDate: new Date("2021-01-01T00:00:00"),
      endDate: new Date("2021-05-15T24:00:00"),
      tpMultiplier:2.2,
      slMultiplier:1.7
  });
  let now2=Date.now()
  console.log((now2-now1)/1000)
}

test4=async()=>{
  let now1=Date.now()
  await rsiEma({
    pair:"ETHUSDT",
    interval:"1m",
    startFund:new Big(200),
    startDate:new Date("2019-02-25T00:00:00"),
    endDate:new Date("2019-03-25T24:00:00"),
    tpMultiplier:2,
    slMultiplier:2.2
  });
}

test5=async ()=>{
  await parSarMacdEma({
    pair:"ETHUSDT",
    interval:"1h",
    highInterval:"4h",
    startFund:new Big(200),
    startDate:new Date("2021-01-01T00:00:00"),
    endDate:new Date("2021-05-25T24:00:00"),
    tpMultiplier:4,
    slMultiplier:2
  })
}
test5();