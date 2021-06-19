const {
  CrossDown,
  CrossUp,
  StochasticRSI,
  EMA,
  ATR,
  RSI,
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

exports.calculateIndicators = (result) => {
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
  const ema8 = EMA.calculate({
    period: 8,
    values: close,
  });
  const ema14 = EMA.calculate({
    period: 14,
    values: close,
  });
  const ema50 = EMA.calculate({
    period: 50,
    values: close,
  });
  //tulind stoch ve technicalindicators stoch çıktısı karşılaştırıldı ikiside aynı çıktı verdi.
  const stochastic = Stochastic.calculate({
    high,
    low,
    close,
    period: 14,
    signalPeriod: 3,
  });
  const stochK = stochastic.map((element) => element.k);
  const stochD = stochastic.map((element) => element.d);
  const stochCrossUps = CrossUp.calculate({ lineA: stochK, lineB: stochD });
  const stochCrossDowns = CrossDown.calculate({ lineA: stochK, lineB: stochD });
  const atr = ATR.calculate({
    high,
    low,
    close,
    period: 14,
  });
  return {
    ema8,
    ema14,
    ema50,
    stochD,
    stochK,
    stochCrossUps,
    stochCrossDowns,
    atr,
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
