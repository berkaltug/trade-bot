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
const test1 = async () => {
  
    await testRsiEmaEngulf({
      pair: "ETHUSDT",
      interval: "4h",
      startFund:new Big(200),
      startDate: new Date("2020-01-01T00:00:00"),
      endDate: new Date("2021-01-01T00:00:00"),
      tpMultiplier:2,
      slMultiplier:1.5
    });
  
};


//console.log(util.inspect(talib.explain("MACD"), { depth:5 }));

test1();