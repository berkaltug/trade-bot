const Big = require("big.js");
Big.DP = 10;
exports.SellOperation = (dataset, i) => {
  //satım için kontrol ediyor
  if (dataset.positionType === "long") {
    if (dataset.close[i] >= dataset.takeProfit) {
      let amount = dataset.takeProfit.times(dataset.coinAmount);
      //komisyon kesimi
      let withFee = amount.plus(amount.div(100000).times(25));
      dataset.finalFund = dataset.finalFund.plus(withFee);
      dataset.coinAmount = 0;
      dataset.successLongOrder++;
      dataset.openPositions = 0;
    } else if (dataset.close[i] <= dataset.stopLoss) {
      let amount = dataset.stopLoss.times(dataset.coinAmount);
      //komisyon kesimi
      let withFee = amount.plus(amount.div(100000).times(25));
      dataset.finalFund = dataset.finalFund.plus(withFee);
      dataset.coinAmount = 0;
      dataset.failedLongOrder++;
      dataset.openPositions = 0;
    }
  }
  if (dataset.positionType === "short") {
    if (dataset.close[i] <= dataset.takeProfit) {
      let amount = dataset.takeProfit.times(dataset.coinAmount);
      //komisyon kesimi
      let withFee = amount.minus(amount.div(100000).times(25));
      dataset.finalFund = dataset.shortHelper.plus(
        dataset.shortHelper.minus(withFee)
      );
      dataset.coinAmount = 0;
      dataset.successShortOrder++;
      dataset.openPositions = 0;
    } else if (dataset.close[i] >= dataset.stopLoss) {
      let amount = dataset.stopLoss.times(dataset.coinAmount);
      //komisyon kesimi
      let withFee = amount.minus(amount.div(100000).times(25));
      dataset.finalFund = dataset.shortHelper.plus(
        dataset.shortHelper.minus(withFee)
      );
      dataset.coinAmount = 0;
      dataset.failedShortOrder++;
      dataset.openPositions = 0;
    }
  }
};
exports.SellOperationNoCommission = (dataset, i) => {
  //satım için kontrol ediyor
  if (dataset.positionType === "long") {
    if (dataset.high[i] >= dataset.takeProfit) {
      let amount = dataset.takeProfit.times(dataset.coinAmount);

      dataset.finalFund = dataset.finalFund.plus(amount);
      dataset.coinAmount = 0;
      dataset.successLongOrder++;
      dataset.openPositions = 0;
    } else if (dataset.low[i] <= dataset.stopLoss) {
      let amount = dataset.stopLoss.times(dataset.coinAmount);

      dataset.finalFund = dataset.finalFund.plus(amount);
      dataset.coinAmount = 0;
      dataset.failedLongOrder++;
      dataset.openPositions = 0;
    }
  }
  if (dataset.positionType === "short") {
    if (dataset.low[i] <= dataset.takeProfit) {
      let amount = dataset.takeProfit.times(dataset.coinAmount);

      dataset.finalFund = dataset.shortHelper.plus(
        dataset.shortHelper.minus(amount)
      );
      dataset.coinAmount = 0;
      dataset.successShortOrder++;
      dataset.openPositions = 0;
    } else if (dataset.high[i] >= dataset.stopLoss) {
      let amount = dataset.stopLoss.times(dataset.coinAmount);

      dataset.finalFund = dataset.shortHelper.plus(
        dataset.shortHelper.minus(amount)
      );
      dataset.coinAmount = 0;
      dataset.failedShortOrder++;
      dataset.openPositions = 0;
    }
  }
};
exports.buyLong = (dataset, i) => {
  //long alım yapıyor
  dataset.openPositions = 1;
  dataset.positionType = "long";
  dataset.totalOrder++;
  //komisyon kesimi
  dataset.finalFund = dataset.finalFund.minus(dataset.finalFund.div(100000).times(75));
  dataset.coinAmount = dataset.finalFund.div(dataset.close[i - 1]);
  dataset.finalFund = new Big(0);
};
exports.buyShort = (dataset, i) => {
  dataset.openPositions = 1;
  dataset.positionType = "short";
  dataset.totalOrder++;
  //komisyon kesimi
  dataset.finalFund = dataset.finalFund.minus(dataset.finalFund.div(100000).times(75));
  dataset.shortHelper = dataset.finalFund;
  dataset.coinAmount = dataset.finalFund.div(dataset.close[i - 1]);
  dataset.finalFund = new Big(0);
};
exports.buyLongNoCommission = (dataset, i) => {
  //long alım yapıyor
  dataset.openPositions = 1;
  dataset.positionType = "long";
  dataset.totalOrder++;
  dataset.coinAmount = dataset.finalFund.div(dataset.close[i - 1]);
  dataset.finalFund = new Big(0);
};
exports.buyShortNoCommission = (dataset, i) => {
  dataset.openPositions = 1;
  dataset.positionType = "short";
  dataset.totalOrder++;
  dataset.shortHelper = dataset.finalFund;
  dataset.coinAmount = dataset.finalFund.div(dataset.close[i - 1]);
  dataset.finalFund = new Big(0);
};
