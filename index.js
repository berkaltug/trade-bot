const bybit = require("./src/bybit");
const moment = require("moment");
const talib = require('talib');
const {
  CrossDown,
  CrossUp,
  StochasticRSI,
  EMA,
  ATR,
  Stochastic,
} = require("technicalindicators");
const tulind = require("tulind");
const { getPositions } = require("./src/requests/nativeRequests");
global.positionCount=0;
const testnet = () => {
  setInterval( async () => {
    let result= await getPrices();
    let {ema8,ema14,ema50,stochastic,atr}=calculateIndicators(result);
  }, 3000);
};

const getPrices = async ()=>{
  try {
    let result = await bybit.fetchOHLCV("ETH/USDT", "1h", moment().subtract(200,"hours"));
    result.pop() // don't look current candle
    return result;
  } catch (e) {
    console.error(e);
  }
}

const calculateIndicators= async (result)=>{
  const open=[],high=[],close=[],low=[];
  result && result.length && result.forEach(element => {
    open.push(element[1])
    high.push(element[2])
    low.push(element[3])
    close.push(element[4])
  });
  const ema8=EMA.calculate({
    period:8,
    values:close
  })
  const ema14=EMA.calculate({
    period:14,
    values:close
  })
  const ema50=EMA.calculate({
    period:50,
    values:close
  })
  //tulind stoch ve technicalindicators stoch çıktısı karşılaştırıldı ikiside aynı çıktı verdi.
  const stochastic=Stochastic.calculate({
    high,
    low,
    close,
    period:14,
    signalPeriod:3
  })
  const stochK=stochastic.map(element=>element.k)
  const stochD=stochastic.map(element=>element.d)
  const stochCrossUps = CrossUp.calculate({ lineA: stochK, lineB: stochD });
  const stochCrossDowns = CrossDown.calculate({ lineA: stochK, lineB: stochD });
  const atr=ATR.calculate({
    high,
    low,
    close,
    period:14
  })
  return {ema8,ema14,ema50,stochD,stochK,stochCrossUps,stochCrossDowns,atr}
}

const analyze= async ({ema8,ema14,ema50,stochastic,stochCrossUps,stochCrossDowns,atr})=>{
  try {
    const positions=await getPositions("ETHUSDT").result;
    if(positions.length==0){
      const money=await bybit.fetchBalance().USDT.free;
      if(last(ema8)>last(ema14) && last(ema14)>last(ema50)){
        if((last(stochCrossUps) || stochCrossUps[stochCrossUps.length-2]) && last(stochK) < 40 && last(stochD)<40){
          //buylong
        }
      }else if(last(ema8)<last(ema14) && last(ema14) < last(ema50)){
        if((last(stochCrossDowns) || stochCrossDowns[stochCrossDowns.length-1]) && last(stochK)>60 && last(stochD)>60){
          //buy short
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

const last=arr=>arr[arr.length-1]
// testnet()
// bybit.fetchOrders("ETH/USDT").then(res=>console.log(res));
// bybit.fetchBalance().then(res=>console.log(res));

// const order=bybit.createOrder("ETH/USDT")
// getPositions("ETHUSDT").then(res=>console.log(res))
params={
  take_profit:9000,
  stop_loss:400
}
try{
  bybit.createOrder("ETH/USDT","limit","buy",1,2600,params);

}catch(e){
  console.error(e);
}

