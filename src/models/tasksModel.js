"use strict";
module.exports = function (sequelize, DataTypes) {
  var wm_tasks = sequelize.define(
    "wm_tasks",
    {
      task_id: {
        type: DataTypes.STRING(500),
        primaryKey: true,
        allowNull: false,
        unique: true
      },
      user_id: DataTypes.STRING(255),
      title: DataTypes.STRING(255),
      task_description: DataTypes.TEXT,
      status: DataTypes.INTEGER, // ? Default: 0. Active | Pending, 1: Finished.
      is_deleted: DataTypes.INTEGER,
      created_datetime: DataTypes.STRING(255),
      updated_datetime: DataTypes.STRING(255)
    },
    {
      tableName: "wm_tasks",
      timestamps: false,
      underscored: true
    }
  );

  wm_tasks.associate = function (models) {
    wm_tasks.belongsTo(models.adminPermissions, {
      as: "admin_permissions",
      foreignKey: "user_id",
      targetKey: "user_id"
    });
    wm_tasks.belongsTo(models.userProfile, {
      foreignKey: "user_id",
      targetKey: "user_id"
    });
  };

  return wm_tasks;
};
