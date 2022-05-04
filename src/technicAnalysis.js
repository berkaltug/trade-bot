const { forEach } = require("lodash");
const {
  CrossDown,
  CrossUp,
  MACD,
  EMA,
  ATR,
  RSI,
  PSAR,
  Stochastic,
} = require("technicalindicators");

exports.engulfingCheck = (
  currentClose,
  currentOpen,
  previousClose,
  previousOpen
) => {
  if (
    previousClose < previousOpen &&
    currentClose > currentOpen &&
    currentClose > previousOpen &&
    currentOpen <= previousClose
  ) {
    return "bullish";
  } else if (
    previousClose > previousOpen &&
    currentClose < currentOpen &&
    currentClose < previousOpen &&
    currentOpen >= previousClose
  ) {
    return "bearish";
  } else {
    return "none";
  }
};

const CROSS_DOWN="cross_down"
const CROSS_UP="cross_up"
exports.CROSS_DOWN=CROSS_DOWN
exports.CROSS_UP=CROSS_UP
exports.cross=(fastEmaPrevious , fastEmaCurrent , slowEmaPrevious , slowEmaCurrent )=>{
  if(fastEmaPrevious<slowEmaPrevious && fastEmaCurrent > slowEmaCurrent) {
    return CROSS_UP;
  }
  else if(fastEmaPrevious>slowEmaPrevious && fastEmaCurrent < slowEmaCurrent){
    return CROSS_DOWN;
  }
  else{
    return null;
  }
}

const trendDirection=(prices)=>{
  let upward=0,downward=0;
  for(let i=0;i<prices.length;i++){
    if(i<prices.length-1){ //dont count last item
      if(prices[i+1] > prices[i]){
        upward++;
      }else if(prices[i+1] < prices[i]){
        downward++;
      }
    }
  }
  return upward > downward ? "upward" : "downward" ;
}

exports.trendDirection=trendDirection;

