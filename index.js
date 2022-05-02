const moment = require("moment");
const dotenv = require('dotenv').config();
const express = require('express');
const app=express();
const port=process.env.PORT || 3000;
const {signalAlgorithm} =require('./src/signalAlgorithm')
const db = require("./src/models");
const {pingInterval}=require('./src/sleepHandler');

db.sequelize.sync();

app.get('/',(req,res)=>{
  res.send("bot is working...");
})
app.listen(port,()=>{
  console.log(`bot started on port ${port}`);
  signalAlgorithm();
})

 pingInterval()