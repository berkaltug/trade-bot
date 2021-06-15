const dotenv = require("dotenv").config();
const fetch = require("node-fetch");
const moment = require("moment");
const { getSignature } = require("./signing");
const getTimestamp = () => {};
exports.getOrders = async (symbol) => {
  const timestamp = moment().utc().valueOf();
  const params = {
    symbol: symbol,
    timestamp: timestamp,
  };
  const sign = getSignature(params);
  let response = await fetch(
    `${process.env.TESTNET_URL}/private/linear/order/search?api_key=${process.env.BYBIT_TESTNET_API_KEY}&symbol=${symbol}&timestamp=${timestamp}&sign=${sign}`
  );
  return response.json();
};
exports.getPositions = async (symbol) => {
  const timestamp = moment().utc().valueOf();
  const params = {
    symbol: symbol,
    timestamp: timestamp,
  };
  const sign = getSignature(params);
  const response = await fetch(
    `${process.env.TESTNET_URL}/private/linear/position/list?api_key=${process.env.BYBIT_TESTNET_API_KEY}&symbol=${symbol}&timestamp=${timestamp}&sign=${sign}`
  );
  return response.json();
};

exports.cancelAllOrders = async (symbol) => {
  const timestamp = moment().utc().valueOf();
  const params = {
    symbol: symbol,
    timestamp: timestamp,
  };
  const sign = getSignature(params);
  const body = {
    api_key: process.env.BYBIT_TESTNET_API_KEY,
    symbol,
    timestamp,
    sign,
  };
  await fetch(`${process.env.TESTNET_URL}/private/linear/order/cancel-all`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};
