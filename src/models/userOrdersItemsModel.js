"use strict";
module.exports = function (sequelize, DataTypes) {
  var wm_user_order_items = sequelize.define(
    "wm_user_order_items",
    {
      user_order_item_id: {
        type: DataTypes.STRING(500),
        primaryKey: true,
        allowNull: false,
        unique: true
      },
      user_orders_id: DataTypes.STRING(255),
      user_id: DataTypes.STRING(255),
      product_id: DataTypes.STRING(255),
      qty: DataTypes.INTEGER,
      text_amount: DataTypes.DECIMAL(10, 2),
      total_amount: DataTypes.DECIMAL(10, 2),
      is_deleted: DataTypes.TINYINT(1),
      created_datetime: DataTypes.STRING(255),
      updated_datetime: DataTypes.STRING(255)
    },
    {
      tableName: "wm_user_order_items",
      timestamps: false,
      underscored: true
    }
  );

  wm_user_order_items.associate = function (models) {

    wm_user_order_items.belongsTo(models.product,{
      foreignKey: "product_id",
      targetKey: "product_id"
    })

    // wm_user_order_items.belongsTo(models.adminPermissions, {
    //   as: "admin_permissions",
    //   foreignKey: "user_id",
    //   targetKey: "user_id"
    // });
    // wm_user_order_items.belongsTo(models.userProfile, {
    //   foreignKey: "user_id",
    //   targetKey: "user_id"
    // });
  };

  return wm_user_order_items;
};
