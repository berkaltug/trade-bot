const { ccxtBinance } = require('./binance');
const { EMA,CrossDown,CrossUp } = require('technicalindicators');
const { last } = require('./utils');
const bot=require('./telegramBot');
const moment=require("moment");
const { botInfo } = require('./telegramBot');
let chatIds=[]

bot.command("register",(ctx)=>{
    console.log("user registered");
    if (!chatIds.includes(ctx.message.chat.id)){
        chatIds.push(ctx.message.chat.id)
    }
})

bot.command("unregister",(ctx)=>{
    console.log("user unregistered");
    chatIds=chatIds.filter(id=>id!=ctx.message.chat.id)
})

bot.launch()

const sendMsg=(msg)=>{
    chatIds.forEach(chatId=>{
        bot.telegram.sendMessage(chatId,msg);
    })
}

exports.threeEmaSignal = async () => {
    // send since undefined cause 1000 candle is enough, limit=1000
    let binancePrices = await ccxtBinance.fetchOHLCV('BTC/USDT', '1h',undefined,1000); //binance support max 1000 candle 
    let crossUp10to20, crossUp20to50, crossDown10to20, crossDown20to50,goldenCrossUp,goldenCrossDown;
    let crossUp10to20Happened, crossUp20to50Happened, crossDown10to20Happened, crossDown20to50Happened;
    console.log("bot started " + moment().format("DD-MM-YYYY HH:mm:ss"))
    setInterval(async () => {
        binancePrices = await ccxtBinance.fetchOHLCV('BTC/USDT', '1h');
        let closeValues = binancePrices.map(candle => candle[4])
        let date=moment().format("DD-MM-YYYY HH:mm:ss");
        let ema10 = EMA.calculate({
            values: closeValues,
            period: 10
        });
        let ema20 = EMA.calculate({
            values: closeValues,
            period: 20
        })
        let ema50 = EMA.calculate({
            values: closeValues,
            period: 50
        })
        let ema200 = EMA.calculate({
            values: closeValues,
            period: 200
        })
        //cross calculations 
        crossUp10to20=last(CrossUp.calculate({lineA:ema10,lineB:ema20}));
        crossUp20to50=last(CrossUp.calculate({lineA:ema20,lineB:ema50}));
        crossDown10to20=last(CrossDown.calculate({lineA:ema10,lineB:ema20}));
        crossDown20to50=last(CrossDown.calculate({lineA:ema20,lineB:ema50}));
        goldenCrossDown=last(CrossDown.calculate({lineA:ema50,lineB:ema200}));
        goldenCrossUp=last(CrossUp.calculate({lineA:ema50,lineB:ema200}));
        if (crossUp10to20){
            crossUp10to20Happened=true
            crossDown10to20Happened=false
        } 
        if(crossUp20to50){
            crossUp20to50Happened=true
            crossDown20to50Happened=false
        }
        if (crossDown10to20){
            crossUp10to20Happened=false
            crossDown10to20Happened=true
        } 
        if(crossDown20to50){
            crossUp20to50Happened=false
            crossDown20to50Happened=true
        }
        if(crossUp10to20Happened && crossUp20to50Happened){
            const msg="BTC/USDT 1h (Binance) grafiğinde 10ema 20ema'yı ve 20ema 50ema'yı YUKARI yönlü kırdı. " + date.toString()
            sendMsg(msg);
        }
        if(crossDown10to20Happened && crossDown20to50Happened){
            const msg="BTC/USDT 1h (Binance) grafiğinde 10ema 20ema'yı ve 20ema 50ema'yı AŞAĞI yönlü kırdı. " + date.toString()
           sendMsg(msg);
        }
        if (goldenCrossUp){
            const msg="BTC/USDT 1h (Binance) grafiğinde YUKARI Yönlü golden cross gerçekleşti. " + date.toString()
            sendMsg(msg);
        }
        if (goldenCrossDown){
            const msg="BTC/USDT 1h (Binance) grafiğinde AŞAĞI Yönlü golden cross gerçekleşti. " + date.toString()
            sendMsg(msg);
        }
    },300000);
}

