 const {Telegraf} = require('telegraf');
 const bot = new Telegraf(process.env.TELEGRAM_KEY)

module.exports=bot;