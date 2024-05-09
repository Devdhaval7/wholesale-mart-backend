"use strict";
module.exports = function (sequelize, DataTypes) {
  var wm_products = sequelize.define(
    "wm_products",
    {
      product_id: {
        type: DataTypes.STRING(500),
        primaryKey: true,
        allowNull: false,
        unique: true
      },
      product_category_id: DataTypes.STRING(255),
      product_subcategory_id: DataTypes.STRING(255),
      product_name: DataTypes.STRING(255),
      product_description: DataTypes.TEXT,
      price: DataTypes.DECIMAL(10, 2),
      attribute_color: DataTypes.STRING(255),
      attribute_material: DataTypes.STRING(255),
      attribute_shape: DataTypes.STRING(255),
      attribute_size: DataTypes.STRING(255),
      status: DataTypes.INTEGER, // ? Default: 0 Not Active , 1: Active, 2:Blocked.
      is_deleted: DataTypes.INTEGER,
      created_datetime: DataTypes.STRING(255),
      updated_datetime: DataTypes.STRING(255)
    },
    {
      tableName: "wm_products",
      timestamps: false,
      underscored: true
    }
  );

  wm_products.associate = function (models) {
    wm_products.hasMany(models.productPhotos, {
      foreignKey: 'product_id',
      targetKey: 'product_id'
    });
    wm_products.belongsTo(models.productCategory, {
      foreignKey: "product_category_id",
      targetKey: "product_category_id"
    });
    wm_products.belongsTo(models.productSubCategory, {
      foreignKey: "product_subcategory_id",
      targetKey: "product_subcategory_id"
    });
  };

  return wm_products;
};
