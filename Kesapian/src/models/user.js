<<<<<<< HEAD
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
        location: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        preferences: {
            type: DataTypes.TEXT, // Simpan array string sebagai JSON string
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('preferences');
                return rawValue ? JSON.parse(rawValue) : null;
            },
            set(value) {
                this.setDataValue('preferences', JSON.stringify(value));
            }
        },
        is_private: {
            type: DataTypes.BOOLEAN, 
            allowNull: false,
            defaultValue: true,
        },
    }, {
        tableName: 'Users', // Nama tabel di database
        timestamps: true, // createdAt, updatedAt
    });

    User.associate = (models) => {
        // Asosiasi dengan Friendship
        User.hasMany(models.Friendship, {
            as: 'SentRequests', // Permintaan pertemanan yang dikirim oleh user ini
            foreignKey: 'requesterId'
        });
        User.hasMany(models.Friendship, {
            as: 'ReceivedRequests', // Permintaan pertemanan yang diterima oleh user ini
            foreignKey: 'addresseeId'
        });
    };

    return User;
};
=======
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
        location: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        preferences: {
            type: DataTypes.TEXT, // Simpan array string sebagai JSON string
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('preferences');
                return rawValue ? JSON.parse(rawValue) : null;
            },
            set(value) {
                this.setDataValue('preferences', JSON.stringify(value));
            }
        },
        is_private: {
            type: DataTypes.BOOLEAN, 
            allowNull: false,
            defaultValue: true,
        },
    }, {
        tableName: 'Users', // Nama tabel di database
        timestamps: true, // createdAt, updatedAt
    });

    User.associate = (models) => {
        // Asosiasi dengan Friendship
        User.hasMany(models.Friendship, {
            as: 'SentRequests', // Permintaan pertemanan yang dikirim oleh user ini
            foreignKey: 'requesterId'
        });
        User.hasMany(models.Friendship, {
            as: 'ReceivedRequests', // Permintaan pertemanan yang diterima oleh user ini
            foreignKey: 'addresseeId'
        });
    };

    return User;
};
>>>>>>> ad9647da20c3bb7cbbd3363a20d70f7b2a640fe5
