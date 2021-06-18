const crypto = require('crypto');
const dotenv = require('dotenv').config();
const moment = require("moment");

exports.getSignature=(parameters)=>{
    parameters.api_key=process.env.BYBIT_TESTNET_API_KEY;
	parameters.recv_window=20000;
	var orderedParams = "";
	Object.keys(parameters).sort().forEach(function(key) {
	  orderedParams += key + "=" + parameters[key] + "&";
	});
	orderedParams = orderedParams.substring(0, orderedParams.length - 1);
	return crypto.createHmac('sha256', process.env.BYBIT_TESTNET_API_SECRET).update(orderedParams).digest('hex');
}