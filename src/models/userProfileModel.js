"use strict";
module.exports = function (sequelize, DataTypes) {
  var wm_user_profile = sequelize.define(
    "wm_user_profile",
    {
      user_profile_id: {
        type: DataTypes.STRING(500),
        primaryKey: true,
        allowNull: false,
        unique: true
      },
      user_id: DataTypes.STRING(255),
      company_name: DataTypes.STRING(255),
      address_main_line: DataTypes.STRING(255),
      city: DataTypes.STRING(255),
      state: DataTypes.STRING(255),
      postcode: DataTypes.STRING(255),
      country: DataTypes.STRING(255),
      phone_number: DataTypes.STRING(255),
      landline_number: DataTypes.STRING(255),
      gst_number: DataTypes.STRING(255),
      is_deleted: DataTypes.INTEGER,
      created_datetime: DataTypes.STRING(255),
      updated_datetime: DataTypes.STRING(255)
    },
    {
      tableName: "wm_user_profile",
      timestamps: false,
      underscored: true
    }
  );

  // wm_user_profile.associate = function (models) {
  //     wm_user_profile.belongsTo(models.adminPermissions, {
  //         as: 'admin_permissions',
  //         foreignKey: 'user_id',
  //         targetKey: 'user_id'
  //     });
  //     wm_user_profile.belongsTo(models.userNotificationPreference, {
  //         foreignKey: 'user_id',
  //         targetKey: 'user_id'
  //     });
  //     wm_user_profile.hasMany(models.userSubscription, {
  //         foreignKey: 'user_id',
  //         targetKey: 'user_id'
  //     });
  //     wm_user_profile.hasMany(models.klaviyoUsers, {
  //         foreignKey: 'user_id',
  //         targetKey: 'user_id'
  //     });
  // };

  return wm_user_profile;
};
