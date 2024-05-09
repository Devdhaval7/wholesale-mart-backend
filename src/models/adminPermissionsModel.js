'use strict';
module.exports = function (sequelize, DataTypes) {
    var wm_admin_permissions = sequelize.define('wm_admin_permissions', {
        admin_permission_id: {
            type: DataTypes.STRING(500),
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.STRING(256),
        permission_id: DataTypes.STRING(500),
        created_datetime: DataTypes.STRING(100),
        updated_datetime: DataTypes.STRING(100),
    }, {
        tableName: 'wm_admin_permissions',
        timestamps: false,
        underscored: true,
    });
    
    wm_admin_permissions.associate = function (models) {
        wm_admin_permissions.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });

        wm_admin_permissions.belongsTo(models.permissions, {
            foreignKey: 'permission_id',
            targetKey: 'permission_id'
        });
    };
    return wm_admin_permissions;
};