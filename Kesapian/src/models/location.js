const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UserLocation = sequelize.define('UserLocation', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            references: {
                model: 'Users', 
                key: 'id',
            },
            unique: true,
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true, 
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true, 
        },
        last_updated: {
            type: DataTypes.DATE, 
            allowNull: true, 
            defaultValue: DataTypes.NOW, 
        },
    }, {
        tableName: 'UserLocations',            
        timestamps: false,
        underscored: true, 
    });

    return UserLocation;
};