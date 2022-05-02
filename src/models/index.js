const Sequelize = require("sequelize");
let sequelize;
console.log(process.env.ENVIRONMENT);
if (process.env.ENVIRONMENT==="heroku"){
     sequelize = new Sequelize(process.env.DATABASE_URL,{
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
         }
    })
}
if (process.env.ENVIRONMENT==="local"){
     sequelize = new Sequelize(process.env.DATABASE_URL,{dialect:"postgres"})

}
 
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.follower = require("./follower.model.js")(sequelize, Sequelize);
module.exports = db; 