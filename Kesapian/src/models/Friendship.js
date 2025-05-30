<<<<<<< HEAD
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Friendship = sequelize.define('Friendship', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        requesterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users', 
                key: 'id',
            },
        },
        addresseeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            },
        },
        status: { 
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pending',
        },
    }, {
        tableName: 'Friendships', 
        timestamps: true, 
        indexes: [ 
            {
                unique: true,
                fields: ['requesterId', 'addresseeId']
            }
        ]
    });

    Friendship.associate = (models) => {
        // Friendship belong to two Users
        Friendship.belongsTo(models.User, { as: 'Requester', foreignKey: 'requesterId' });
        Friendship.belongsTo(models.User, { as: 'Addressee', foreignKey: 'addresseeId' });
    };

    return Friendship;
=======
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Friendship = sequelize.define('Friendship', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        requesterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users', 
                key: 'id',
            },
        },
        addresseeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            },
        },
        status: { 
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pending',
        },
    }, {
        tableName: 'Friendships', 
        timestamps: true, 
        indexes: [ 
            {
                unique: true,
                fields: ['requesterId', 'addresseeId']
            }
        ]
    });

    Friendship.associate = (models) => {
        // Friendship belong to two Users
        Friendship.belongsTo(models.User, { as: 'Requester', foreignKey: 'requesterId' });
        Friendship.belongsTo(models.User, { as: 'Addressee', foreignKey: 'addresseeId' });
    };

    return Friendship;
>>>>>>> ad9647da20c3bb7cbbd3363a20d70f7b2a640fe5
};