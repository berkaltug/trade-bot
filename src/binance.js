const Binance = require('node-binance-api');
const ccxt = require('ccxt');
exports.binance=new Binance().options({
    APIKEY:process.env.API_KEY,
    APISECRET:process.env.API_SECRET
});

exports.ccxtBinance = new ccxt.binance({
    'apiKey':process.env.BINANCE_API_KEY,
    'secret':process.env.BINANCE_SECRET_KEY
})

