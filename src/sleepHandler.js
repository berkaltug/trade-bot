const axios = require('axios');
const url="https://berk-trade-bot.herokuapp.com/"
exports.pingInterval=()=>{
    setInterval(()=>{
        axios.get(url)
    },300000)
}