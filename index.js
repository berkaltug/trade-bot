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
const { getPositions, getOrders } = require("./src/requests/nativeRequests");
const { getLastPrice } = require("./src/operations");

global.positionCount=0;

const testnet = () => {
  setInterval( async () => {
    let result= await getPrices("ETH/USDT", "1h", moment().subtract(200,"minutes"));
    let {ema8,ema14,ema50,stochastic,atr}=calculateIndicators(result);
  }, 3000);
};

// testnet()
// bybit.fetchOrders("ETH/USDT").then(res=>console.log(res));
// bybit.fetchBalance().then(res=>console.log(res));

// const order=bybit.createOrder("ETH/USDT")
getOrders("ETHUSDT").then(res=>console.log(res))
// params={
//   take_profit:9000,
//   stop_loss:400
// }
// try{
//   bybit.createOrder("ETH/USDT","limit","buy",1,2600,params);

// }catch(e){
//   console.error(e);
// }

// getLastPrice("ETH/USDT").then(res=>console.log(res))