const { ccxtBinance } = require("./binance");
const { EMA, CrossDown, CrossUp, PSAR } = require("technicalindicators");
const { last, last2nd } = require("./utils");
const { bot, sendMsg } = require("./telegramBot");
const moment = require("moment");

exports.signalAlgorithm = async () => {

  let crossUp10to20, crossDown10to20, goldenCrossUp, goldenCrossDown;
  let crossUp10to20Happened, crossDown10to20Happened;
  let lastPsar, currentPsar;
  console.log("bot started " + moment().format("DD-MM-YYYY HH:mm:ss"));

  setInterval(async () => {
  // send since undefined cause 1000 candle is enough, limit=1000
  //binance support max 1000 candle
    binancePrices = await ccxtBinance.fetchOHLCV(
      "BTC/USDT",
      "1h",
      undefined,
      1000
    );
    let closeValues = binancePrices.map((candle) => candle[4]);
    let date = moment().format("DD-MM-YYYY HH:mm:ss");
    console.log("working " + date.toString());
    let ema10 = EMA.calculate({
      values: closeValues,
      period: 10,
    });
    let ema20 = EMA.calculate({
      values: closeValues,
      period: 20,
    });
    let ema50 = EMA.calculate({
      values: closeValues,
      period: 50,
    });
    let ema200 = EMA.calculate({
      values: closeValues,
      period: 200,
    });
    //cross calculations
    let crossUp=CrossDown.calculate({ lineA: ema10, lineB: ema20 })
    crossUp10to20 = last(CrossUp.calculate({ lineA: ema10, lineB: ema20 }));
    crossDown10to20 = last(CrossDown.calculate({ lineA: ema10, lineB: ema20 }));
    let highValues = binancePrices.map((candle) => candle[2]);
    let lowValues = binancePrices.map((candle) => candle[3]);
    let psar = PSAR.calculate({
      high: highValues,
      low: lowValues,
      step: 0.02,
      max: 0.2,
    });
    lastPsar = last2nd(psar) < last2nd(closeValues) ? "below" : "above";
    currentPsar = last(psar) < last(closeValues) ? "below" : "above";
    goldenCrossDown = last(
      CrossDown.calculate({ lineA: ema50, lineB: ema200 })
    );
    goldenCrossUp = last(CrossUp.calculate({ lineA: ema50, lineB: ema200 }));
    
    if (crossUp10to20) {
      const msg =
        "BTC/USDT 1h (Binance) grafiğinde 10ema 20ema'yı YUKARI yönlü kırdı. " +
        date.toString();
        console.log(msg);
      // sendMsg(msg);
    }
    if (crossDown10to20) {
      const msg =
        "BTC/USDT 1h (Binance) grafiğinde 10ema 20ema'yı AŞAĞI yönlü kırdı. " +
        date.toString();
        console.log(msg);
      // sendMsg(msg);
    }
    if (goldenCrossUp) {
      const msg =
        "BTC/USDT 1h (Binance) grafiğinde YUKARI Yönlü golden cross gerçekleşti. " +
        date.toString();
        console.log(msg);
      // sendMsg(msg);
    }
    if (goldenCrossDown) {
      const msg =
        "BTC/USDT 1h (Binance) grafiğinde AŞAĞI Yönlü golden cross gerçekleşti. " +
        date.toString();
        console.log(msg);
      // sendMsg(msg);
    }
    if (lastPsar !== currentPsar) {
      if (lastPsar === "above" && currentPsar === "below") {
        const msg =
          "BTC/USDT 1h (Binance) grafiğinde PSAR değeri AŞAĞI geçti" +
          date.toString();
          console.log(msg);
        // sendMsg(msg);
      }
      if (lastPsar === "below" && currentPsar === "above") {
        const msg =
          "BTC/USDT 1h (Binance) grafiğinde PSAR değeri YUKARI geçti" +
          date.toString();
          console.log(msg);
        // sendMsg(msg);
      }
    }
  }, 1000*60);
};
