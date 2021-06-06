const { default: Big } = require("big.js");
const { CrossDown, CrossUp, StochasticRSI , EMA , ATR } = require("technicalindicators");
const Big = require("big.js");
exports.StochRsi3Ema = (
  pair,
  interval,
  startFund,
  startDate,
  endDate = new Date()
) => {
  const dataset = {};
  dataset.finalFund = startFund;
  dataset.takeProfit = 0;
  dataset.stopLoss = 0;
  dataset.openPositions = 0;
  dataset.totalOrder = 0;
  dataset.successLongOrder = 0;
  dataset.successShortOrder = 0;
  dataset.failedLongOrder = 0;
  dataset.failedShortOrder = 0;
  dataset.coinAmount = 0;
  dataset.positionType;
  dataset.shortHelper = new Big(0); // short pozisyonda kar-zarar hesaplarken alış bakiyesini burda saklıcaz
};
