const moment = require("moment");
const express = require('express');
const app=express();
const port=process.env.PORT || 3000;
const { default: Big } = require("big.js");
const {intervalToMs} = require('./src/utils');
const {getBybitPrices,getCoinPrices} = require('./src/operations');
const {threeEmaSignal} =require('./src/threeEmaSignal')
app.get('/',(req,res)=>{
  res.send("bot is working...");
})
app.listen(port,()=>{
  console.log(`bot started on port ${port}`);
  threeEmaSignal();
})
