"use strict";
module.exports = function (sequelize, DataTypes) {
  var wm_shopping_list = sequelize.define(
    "wm_shopping_list",
    {
      shopping_list_id: {
        type: DataTypes.STRING(500),
        primaryKey: true,
        allowNull: false,
        unique: true
      },
      user_id: DataTypes.STRING(255),
      is_deleted: DataTypes.TINYINT(1),
      created_datetime: DataTypes.STRING(255),
      updated_datetime: DataTypes.STRING(255)
    },
    {
      tableName: "wm_shopping_list",
      timestamps: false,
      underscored: true
    }
  );

  wm_shopping_list.associate = function (models) {
    wm_shopping_list.hasMany(models.shoppingListItems, {
      foreignKey: 'shopping_list_id',
      targetKey: 'shopping_list_id'
    });


    // wm_shopping_list.belongsTo(models.userProfile, {
    //   foreignKey: "user_id",
    //   targetKey: "user_id"
    // });
  };

  return wm_shopping_list;
};
