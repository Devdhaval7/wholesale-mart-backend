"use strict";
module.exports = function (sequelize, DataTypes) {
  var wm_users = sequelize.define(
    "wm_users",
    {
      user_id: {
        type: DataTypes.STRING(500),
        primaryKey: true,
        allowNull: false,
        unique: true
      },
      user_code: DataTypes.STRING(255),
      name: DataTypes.STRING(255),
      email: DataTypes.STRING(50),
      password: DataTypes.STRING(255),
      user_password: DataTypes.STRING(255),
      profile_image: DataTypes.BLOB("medium"),
      role: DataTypes.STRING(255),
      user_role: DataTypes.INTEGER, // ? 0. normal user, 1. admin, 2. sub admin
      access_token: DataTypes.STRING(500),
      status: DataTypes.INTEGER, // ? Default: 0 Not Active [requested] , 1: Active, 2:Blocked.
      is_deleted: DataTypes.INTEGER,
      otp_code: DataTypes.INTEGER,
      otp_active: DataTypes.INTEGER,
      created_datetime: DataTypes.STRING(255),
      updated_datetime: DataTypes.STRING(255)
    },
    {
      tableName: "wm_users",
      timestamps: false,
      underscored: true
    }
  );

  wm_users.associate = function (models) {
    wm_users.belongsTo(models.adminPermissions, {
      // as: "admin_permissions",
      foreignKey: "user_id",
      targetKey: "user_id"
    });
    wm_users.belongsTo(models.userProfile, {
      foreignKey: "user_id",
      targetKey: "user_id"
    });
  };

  return wm_users;
};
