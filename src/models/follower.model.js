module.exports = (sequelize, Sequelize) => {
    const Follower = sequelize.define("follower", {
      chatId: {
        type: Sequelize.INTEGER,
        allowNull:false,
        unique:true,
        field:"chat_id"
      }
    });
    return Follower;
  };