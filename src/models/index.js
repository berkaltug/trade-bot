const dbConfig = require("../db.config.js");
const Sequelize = require("sequelize");

//for heroku , configure later conditionally via an env variable
const sequelize = new Sequelize(process.env.DATABASE_URL,{
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
     }
})

//for localhost , configure later via env variables
// const sequelize = new Sequelize(process.env.DATABASE_URL)

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.follower = require("./follower.model.js")(sequelize, Sequelize);
module.exports = db; 