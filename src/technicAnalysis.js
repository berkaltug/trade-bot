const { forEach } = require("lodash");
const {
  CrossDown,
  CrossUp,
  MACD,
  EMA,
  ATR,
  RSI,
  PSAR,
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
exports.calculateSteepAngle=(emaArray)=>{

}

exports.calculateIndicators = (result,resultHighPeriod,resultHighPeriod2nd) => {
  const open = [],
    high = [],
    close = [],
    low = [],
    volume=[],
    openHighPeriod=[],
    highHighPeriod=[],
    closeHighPeriod=[],
    lowHighPeriod=[];

  result &&
  result.length &&
  result.forEach((element) => {
      open.push(element[1]);
      high.push(element[2]);
      low.push(element[3]);
      close.push(element[4]);
      volume.push(element[5]);
    });
  resultHighPeriod2nd &&
  resultHighPeriod2nd.length &&
  resultHighPeriod2nd.forEach((element)=>{
    openHighPeriod.push(element[1]);
    highHighPeriod.push(element[2]);
    lowHighPeriod.push(element[3]);
    closeHighPeriod.push(element[4]);
  })
  resultHighPeriod && 
  resultHighPeriod.length &&
  resultHighPeriod.forEach(element=>{
    openHighPeriod.push(element[1]);
    highHighPeriod.push(element[2]);
    lowHighPeriod.push(element[3]);
    closeHighPeriod.push(element[4]);
  })
  const ema9 = EMA.calculate({
    period: 9,
    values: close,
  });
  const ema14 = EMA.calculate({
    period: 14,
    values: close,
  });
  const ema26 = EMA.calculate({
    period: 26,
    values: close,
  });
  const macd=MACD.calculate({
    values:close,
    fastPeriod:12,
    slowPeriod:26,
    signalPeriod      : 9,
    SimpleMAOscillator: false,
    SimpleMASignal    : false
  });
  const psar=PSAR.calculate({
    high,
    low,
    step:0.02,
    max:0.2
  });
  const rsi = RSI.calculate({
    period: 14,
    values: close,
  });
  const ema200HighPeriod=EMA.calculate({
    period:200,
    values:closeHighPeriod
  })
  const macdLine = macd.map((element) => element.MACD);
  const macdSignal = macd.map((element) => element.signal);
  const macdCrossUps = CrossUp.calculate({ lineA: macdLine, lineB: macdSignal });
  const macdCrossDowns = CrossDown.calculate({ lineA: macdLine, lineB: macdSignal });
  const atr = ATR.calculate({
    high,
    low,
    close,
    period: 14,
  });
  const direction=trendDirection(ema200HighPeriod);
  return {
    ema9,
    ema14,
    ema26,
    rsi,
    macd,
    macdCrossUps,
    macdCrossDowns,
    atr,
    psar,
    ema200HighPeriod,
    direction
  };
};

exports.calculateIndicators2 = (result) => {
  const open = [],
    high = [],
    close = [],
    low = [];
  result &&
    result.length &&
    result.forEach((element) => {
      open.push(element[1]);
      high.push(element[2]);
      low.push(element[3]);
      close.push(element[4]);
    });
  const ema14 = EMA.calculate({
    period: 14,
    values: close,
  });
  const rsi = RSI.calculate({
    period: 14,
    values: close,
  });
  const atr = ATR.calculate({
    high,
    low,
    close,
    period: 14,
  });
  const upperBand = rsi.map((x) => 70);
  const lowerBand = rsi.map((x) => 30);
  const crossDowns = CrossDown.calculate({ lineA: rsi, lineB: upperBand });
  const crossUps = CrossUp.calculate({ lineA: rsi, lineB: lowerBand });

  return {ema14,crossUps,crossDowns,atr}
};

exports.trendDirection=(prices)=>{
  let upward=0,downward=0;
  for(let i=0;i<prices.length;i++){
    if(i<prices.length-1){ //dont count last item
      if(prices[i+1] > prices[i]){
        upwards++;
      }else{
        downwards++;
      }
    }
  }
  return upward > downward ? "upward" : "downward" ;
}