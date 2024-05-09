"use strict";
module.exports = function (sequelize, DataTypes) {
  var wm_product_category = sequelize.define(
    "wm_product_category",
    {
      product_category_id: {
        type: DataTypes.STRING(500),
        primaryKey: true,
        allowNull: false,
        unique: true
      },
      category_name: DataTypes.STRING(500),
      image_url: DataTypes.BLOB("medium"),
      is_deleted: DataTypes.INTEGER,
      created_datetime: DataTypes.STRING(255),
      updated_datetime: DataTypes.STRING(255)
    },
    {
      tableName: "wm_product_category",
      timestamps: false,
      underscored: true
    }
  );

  wm_product_category.associate = function (models) {
    wm_product_category.belongsTo(models.productSubCategory, {
      foreignKey: "product_category_id",
      targetKey: "product_category_id"
    });
  };

  return wm_product_category;
};
