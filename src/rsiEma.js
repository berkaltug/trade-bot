const {fetchAndPrepareValues} = require('./backTestPreperation');
const {EMA,SMA,RSI,ATR, CrossDown, CrossUp}=require("technicalindicators");
const { buyShort, buyLong,sellOperation } = require('./buySellOperations');
const Big=require("big.js")
exports.rsiEma=async ({
    pair,
  interval,
  startFund,
  startDate,
  endDate = new Date(),
  tpMultiplier,
  slMultiplier,
})=>{
    dataset={};
    await fetchAndPrepareValues(
        pair,
        interval,
        startFund,
        startDate,
        endDate,
        dataset
      );

    const ema14=EMA.calculate({
        period:14,
        values:dataset.close.map(x=>x.toNumber())
    })
    const rsi=RSI.calculate({
        period:14,
        values:dataset.close.map(x=>x.toNumber())
    })
    let atr=ATR.calculate({
        period:14,
        high: dataset.high.map((x) => x.toNumber()),
        low: dataset.low.map((x) => x.toNumber()),
        close: dataset.close.map((x) => x.toNumber()),
    })
    atr = atr.map((x) => new Big(x));
    const upperBand=rsi.map(x=>70);
    const lowerBand=rsi.map(x=>30);
    const crossDowns=CrossDown.calculate({lineA:rsi,lineB:upperBand});
    const crossUps=CrossUp.calculate({lineA:rsi,lineB:lowerBand});
    for(let i=14;i<=ema14.length;i++){
        if(dataset.openPositions==0 && dataset.finalFund > 0){
            if(crossDowns[i] || crossDowns[i-1]){
                if(dataset.open[i]>ema14[i]){
                    buyShort(dataset,i);
                    dataset.takeProfit=dataset.open[i].minus(atr[i].times(tpMultiplier));
                    dataset.stopLoss=dataset.open[i].plus(atr[i].times(slMultiplier));
                }
            }
            else if(crossUps[i] || crossUps[i-1]){
                if(dataset.open[i]<ema14[i]){
                    buyLong(dataset,i);
                    dataset.takeProfit=dataset.open[i].plus(atr[i].times(tpMultiplier));
                    dataset.stopLoss=dataset.open[i].minus(atr[i].times(slMultiplier));
                }
            }
        }
        else if(dataset.openPositions==1){
            sellOperation(dataset,i);
        }
    }

    if (dataset.openPositions == 1) {
        dataset.finalFund = dataset.coinAmount.times(
          dataset.close[dataset.close.length - 1]
        );
      }
    
      let percentage = dataset.finalFund.minus(startFund).div(startFund);
      console.log(`
                  start Fund ${startFund}
                  final Fund ${dataset.finalFund.toFixed(2)} 
                  total Order ${dataset.totalOrder}
                  total successful orders ${
                    dataset.successLongOrder + dataset.successShortOrder
                  }
                  total failed orders ${
                    dataset.failedShortOrder + dataset.failedLongOrder
                  }
                  successful  long orders ${dataset.successLongOrder}
                  failed long orders ${dataset.failedLongOrder}
                  successful short orders ${dataset.successShortOrder}
                  failed short orders ${dataset.failedShortOrder}
                  percentage ${percentage}
                  `);
}