"use strict";
module.exports = function (sequelize, DataTypes) {
  var wm_product_photos = sequelize.define(
    "wm_product_photos",
    {
      product_photo_id: {
        type: DataTypes.STRING(500),
        primaryKey: true,
        allowNull: false,
        unique: true
      },
      product_id: DataTypes.STRING(500),
      photo_url: DataTypes.STRING(500),
      img_sort_order: DataTypes.INTEGER,
      is_deleted: DataTypes.INTEGER,
      created_datetime: DataTypes.STRING(255),
      updated_datetime: DataTypes.STRING(255)
    },
    {
      tableName: "wm_product_photos",
      timestamps: false,
      underscored: true
    }
  );

  wm_product_photos.associate = function (models) {
    // wm_product_photos.belongsTo(models.adminPermissions, {
    //   as: "admin_permissions",
    //   foreignKey: "user_id",
    //   targetKey: "user_id"
    // });
    // wm_product_photos.belongsTo(models.userProfile, {
    //   foreignKey: "user_id",
    //   targetKey: "user_id"
    // });
  };

  return wm_product_photos;
};
