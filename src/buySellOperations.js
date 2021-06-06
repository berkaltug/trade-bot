exports.buySellOperation=(dataset,i)=>{
      //satım için kontrol ediyor
      if (dataset.positionType === "long") {
        if (dataset.high[i] >= dataset.takeProfit) {
          let amount =dataset.takeProfit.times(dataset.coinAmount);
          //komisyon kesimi
          let withFee =amount.minus(amount.div(1000)); 
          dataset.finalFund = dataset.finalFund.plus(withFee);
          dataset.coinAmount =0;
          dataset.successLongOrder++;
          dataset.openPositions = 0;
        } else if (dataset.low[i] <= dataset.stopLoss) {
          let amount = dataset.stopLoss.times(dataset.coinAmount);
          //komisyon kesimi
          let withFee = amount.minus(amount.div(1000));
          dataset.finalFund = dataset.finalFund.plus(withFee);
          dataset.coinAmount = 0;
          dataset.failedLongOrder++;
          dataset.openPositions = 0;
        }
      }
      if (dataset.positionType === "short") {
        if (dataset.low[i] <= dataset.takeProfit) {
          let amount = dataset.takeProfit.times(dataset.coinAmount);
          //komisyon kesimi
          let withFee = amount.plus(amount.div(1000));
          dataset.finalFund = dataset.shortHelper.plus(dataset.shortHelper.minus(withFee));
          dataset.coinAmount = 0;
          dataset.successShortOrder++;
          dataset.openPositions = 0;
        } else if (dataset.high[i] >= dataset.stopLoss) {
          let amount = dataset.stopLoss.times(dataset.coinAmount);
          //komisyon kesimi
          let withFee = amount.plus(amount.div(1000));
          dataset.finalFund=dataset.shortHelper.plus(dataset.shortHelper.minus(withFee));
          dataset.coinAmount = 0;
          dataset.failedShortOrder++;
          dataset.openPositions = 0;
        }
      }
}
