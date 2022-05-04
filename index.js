const moment = require("moment");
const dotenv = require('dotenv').config();
const express = require('express');
const app=express();
const port=process.env.PORT || 3000;
const {signalAlgorithm} =require('./src/signalAlgorithm')
const db = require("./src/models");
const {pingInterval}=require('./src/sleepHandler');
const { ccxtBinance } = require("./src/binance");
const { EMA, CrossDown, CrossUp, PSAR } = require("technicalindicators");
const { last, last2nd } = require("./src/utils");
db.sequelize.sync();

app.get('/',(req,res)=>{
  res.send("bot is working...");
})
app.listen(port,async ()=>{
  console.log(`bot started on port ${port}`);
  signalAlgorithm();
})

 //pingInterval()

