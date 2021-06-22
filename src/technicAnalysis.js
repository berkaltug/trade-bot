const {
  CrossDown,
  CrossUp,
  StochasticRSI,
  MACD,
  EMA,
  ATR,
  RSI,
  Stochastic,
  MFI,
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

exports.calculateIndicators = (result) => {
  const open = [],
    high = [],
    close = [],
    low = [],
    volume=[];
  result &&
    result.length &&
    result.forEach((element) => {
      open.push(element[1]);
      high.push(element[2]);
      low.push(element[3]);
      close.push(element[4]);
      volume.push(element[5]);
    });
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
  const mfi=MFI.calculate({
    period:14,
    high,
    low,
    close,
    volume
  });
  const macd=MACD.calculate({
    values:close,
    fastPeriod:12,
    slowPeriod:26,
    signalPeriod      : 9,
    SimpleMAOscillator: false,
    SimpleMASignal    : false
  });

  const rsi = RSI.calculate({
    period: 14,
    values: close,
  });

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
  return {
    ema9,
    ema14,
    ema26,
    rsi,
    macd,
    macdCrossUps,
    macdCrossDowns,
    atr,
    mfi
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
