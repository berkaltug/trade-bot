const ccxt = require('ccxt');
const dotenv = require('dotenv').config();
const bybit=new ccxt.bybit({
"apiKey":process.env.BYBIT_TESTNET_API_KEY,
"secret":process.env.BYBIT_TESTNET_API_SECRET,
"urls":{
    "api":process.env.TESTNET_URL
},
});
module.exports=bybit;