"use strict";
module.exports = function (sequelize, DataTypes) {
  var wm_user_orders = sequelize.define(
    "wm_user_orders",
    {
      user_orders_id: {
        type: DataTypes.STRING(500),
        primaryKey: true,
        allowNull: false,
        unique: true
      },
      user_order_number: DataTypes.STRING(255), // HAX code 6 character
      user_id: DataTypes.STRING(50),
      total_amount: DataTypes.DECIMAL(10, 2),
      user_order_date: DataTypes.STRING(255),
      user_due_date: DataTypes.STRING(255),
      order_status: DataTypes.INTEGER, // ? Default: 0. requested , 1: accepted/processing, 2: rejected, 3: dispatch, 4:deliverd.
      payment_status: DataTypes.INTEGER, // ? Default: 0. due , 1: paid 
      created_datetime: DataTypes.STRING(255),
      updated_datetime: DataTypes.STRING(255)
    },
    {
      tableName: "wm_user_orders",
      timestamps: false,
      underscored: true
    }
  );

  wm_user_orders.associate = function (models) {
    wm_user_orders.hasMany(models.userOrdersItems, {
      foreignKey: "user_orders_id",
      sourceKey: "user_orders_id"
    });
    // wm_user_orders.belongsTo(models.userProfile, {
    //   foreignKey: "user_id",
    //   targetKey: "user_id"
    // });
  };

  return wm_user_orders;
};
