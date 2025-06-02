const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Friendship = sequelize.define('Friendship', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
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
            type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'blocked'),
            allowNull: false,
            defaultValue: 'pending',
        },
    }, {
        tableName: 'Friendships',
        timestamps: true,
        underscored: true,
        indexes: [
            { // Memastikan kombinasi requesterId dan addresseeId unik
                unique: true,
                fields: ['requester_id', 'addressee_id'],
            }
        ]
    });
    return Friendship;
};