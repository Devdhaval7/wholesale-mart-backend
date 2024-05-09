"use strict";
module.exports = function (sequelize, DataTypes) {
  var wm_shopping_list_items = sequelize.define(
    "wm_shopping_list_items",
    {
      shopping_list_item_id: {
        type: DataTypes.STRING(500),
        primaryKey: true,
        allowNull: false,
        unique: true
      },
      shopping_list_id: DataTypes.STRING(255),
      user_id: DataTypes.STRING(255),
      product_id: DataTypes.STRING(255),
      qty: DataTypes.INTEGER,
      created_datetime: DataTypes.STRING(255),
      updated_datetime: DataTypes.STRING(255)
    },
    {
      tableName: "wm_shopping_list_items",
      timestamps: false,
      underscored: true
    }
  );

  wm_shopping_list_items.associate = function (models) {
    wm_shopping_list_items.belongsTo(models.product, {
      foreignKey: "product_id",
      targetKey: "product_id"
    });
  };

  return wm_shopping_list_items;
};
