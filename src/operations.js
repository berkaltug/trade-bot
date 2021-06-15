const binance = require("./binance");
const _ = require("lodash");
const bybit = require("./bybit");
const { getPositions, getOrders, cancelAllOrders } = require("./requests/nativeRequests");
const {last}=require("./utils.js");
const Big=require("big.js");
Big.DP=2;
exports.getCurrentBalance = () => {
  console.log("Your current balances...");
  binance.balance((error, balances) => {
    error && console.log(error);
    _.forEach(balances, (value, key) => {
      if (value.available != 0) {
        console.log(`${key} = ${value.available}`);
      }
    });
  });
};

exports.getUSDTPairs = async () => {
  let prices = await binance.prices();
  const usdtPairs = _.filter(Object.keys(prices), (value, index) => {
    return value.endsWith("USDT");
  });
  return usdtPairs;
};
exports.getCoinPrices = ({ pair, interval, limit, endDate }) => {
  // setTimeout(() => {
    
  // }, 50);
  return new Promise((resolve, reject) => {
    binance.candlesticks(
      pair,
      interval,
      (error, ticks, symbol) => {
        if (error) {
          reject(error);
        } else {
          resolve(ticks);
        }
      },
      { limit, endTime: endDate }
    );
  });
};

exports.getBybitPrices = async (pair,interval,since)=>{
  try {
    let result = await bybit.fetchOHLCV(pair,interval,since);
    const lastPrice=last(result)[4];
    result.pop() // don't look current candle
    return result;
  } catch (e) {
    console.error(e);
  }
}
exports.getLastPrice= async (pair)=>{
  let now1=Date.now()
  try{
    const ticker=await bybit.fetchTicker(pair);
    return ticker.last;
  }catch(e){
    console.error("error while fetching last price" , e);
  }
}

exports.trade= async ({pair,ema8,ema14,ema50,stochastic,stochCrossUps,stochCrossDowns,atr,last})=>{
  try {
    const bybitPair=pair.replace("/","");
    const orders=await getOrders(bybitPair).result;
    const positions=await getPositions(bybitPair).result;
    if(positions.length==0){
      if(orders.length>0){//pozisyon yok ama filled olmayan order beklemede demek
        await cancelAllOrders(bybitPair);
      }
      if(last(ema8)>last(ema14) && last(ema14)>last(ema50)){
        if((last(stochCrossUps) || stochCrossUps[stochCrossUps.length-2]) && last(stochK) < 40 && last(stochD)<40){
          //buylong
          const money=new Big(await bybit.fetchBalance().USDT.free)
          const buyMoney=money.times(99).div(100);
          const lastPrice=new Big(this.getLastPrice())
          const amount=buyMoney.div(lastPrice);
          const ATR=new Big(atr);
          const stop_loss=lastPrice.minus(ATR.times(1.7))
          const take_profit=lastPrice.plus(ATR.times(1.5))
          const params={stop_loss,take_profit}
          bybit.createOrder("ETH/USDT","limit","buy",amount,lastPrice.toNumber(),params)
        }
      }else if(last(ema8)<last(ema14) && last(ema14) < last(ema50)){
        if((last(stochCrossDowns) || stochCrossDowns[stochCrossDowns.length-1]) && last(stochK)>60 && last(stochD)>60){
          //buy short
          const money=new Big(await bybit.fetchBalance().USDT.free)
          const buyMoney=money.times(99).div(100);
          const lastPrice=new Big(this.getLastPrice())
          const amount=buyMoney.div(lastPrice);
          const ATR=new Big(atr);
          const stop_loss=lastPrice.plus(ATR.times(1.7))
          const take_profit=lastPrice.minus(ATR.times(1.5))
          const params={stop_loss,take_profit}
          bybit.createOrder("ETH/USDT","limit","sell",amount,lastPrice.toNumber(),params)
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}