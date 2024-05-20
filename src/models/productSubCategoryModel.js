"use strict";
module.exports = function (sequelize, DataTypes) {
  var wm_product_subcategory = sequelize.define(
    "wm_product_subcategory",
    {
      product_subcategory_id: {
        type: DataTypes.STRING(500),
        primaryKey: true,
        allowNull: false,
        unique: true
      },
      product_category_id: DataTypes.STRING(500),
      subcategory_name: DataTypes.STRING(500),
      image_url: DataTypes.BLOB("medium"),
      is_deleted: DataTypes.INTEGER,
      created_datetime: DataTypes.STRING(255),
      updated_datetime: DataTypes.STRING(255)
    },
    {
      tableName: "wm_product_subcategory",
      timestamps: false,
      underscored: true
    }
  );

  wm_product_subcategory.associate = function (models) {
    // wm_product_subcategory.belongsTo(models.adminPermissions, {
    //   as: "admin_permissions",
    //   foreignKey: "user_id",
    //   targetKey: "user_id"
    // });
    // wm_product_subcategory.belongsTo(models.userProfile, {
    //   foreignKey: "user_id",
    //   targetKey: "user_id"
    // });

    wm_product_subcategory.belongsTo(models.product, {
      foreignKey: "product_category_id",
      targetKey: "product_category_id"
    });
  };

  return wm_product_subcategory;
};
