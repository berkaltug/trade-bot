const dotenv = require("dotenv").config();
const fetch = require("node-fetch");
const moment = require('moment');
const { getSignature } = require("./signing");
const getTimestamp = () => {};
exports.getPositions = async (symbol) => {
    const timestamp=moment().utc().valueOf();
  const params = {
    symbol:symbol,
    timestamp:timestamp
  };
  const sign=getSignature(params);
  let response = await fetch(
    `https://api-testnet.bybit.com/private/linear/order/search?api_key=${process.env.BYBIT_TESTNET_API_KEY}&symbol=${symbol}&timestamp=${timestamp}&sign=${sign}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.json();
};
