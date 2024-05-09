'use strict';
module.exports = function (sequelize, DataTypes) {
    var wm_permissions = sequelize.define('wm_permissions', {
        permission_id: {
            type: DataTypes.STRING(500),
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        name: DataTypes.STRING(256),
        slug: DataTypes.STRING(256),
        created_datetime: DataTypes.STRING(100),
        updated_datetime: DataTypes.STRING(100),
    }, {
        tableName: 'wm_permissions',
        timestamps: false,
        underscored: true,
    });
    
    return wm_permissions;
};