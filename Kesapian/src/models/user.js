const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        preferences: {
            type: DataTypes.TEXT, 
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('preferences');
                try {
                    return rawValue ? JSON.parse(rawValue) : [];
                } catch (e) {
                    console.error('Error parsing preferences:', e);
                    return [];
                }
            },
            set(value) {
                this.setDataValue('preferences', 
                    value && value.length ? JSON.stringify(value) : null
                );
            }
        },
        is_private: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    }, {
        tableName: 'Users', 
        timestamps: true, 
    });

    return User;
};