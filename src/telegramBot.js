 const {Telegraf} = require('telegraf');
 const bot = new Telegraf(process.env.TELEGRAM_KEY)
 const db = require("./models");
 const Follower = db.follower;
 
 bot.command("register", (ctx) => {
   Follower.findOne({
     where: { chatId: ctx.message.chat.id },
   }).then((result) => {
     if (!result) {
       const follower = { chatId: ctx.message.chat.id };
       Follower.create(follower).then((data) => console.log("registered user"));
     }
   });
 });
 
 bot.command("unregister", (ctx) => {
   Follower.destroy({
     where: { chatId: ctx.message.chat.id },
   }).then((data) => {
     console.log("removed user");
   });
 });

exports.sendMsg = (msg) => {
    Follower.findAll().then((results) => {
      results.forEach((result) => {
        bot.telegram.sendMessage(result.chatId, msg);
      });
    });
  };

 bot.launch();

module.exports.bot=bot;