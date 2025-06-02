const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Chat = sequelize.define('Chat', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    sender_id: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sender_id', 
    },
    receiver_id: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'receiver_id',
    },
    message: { 
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'message',
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'timestamp',
    },
    is_blocked: { 
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_blocked',
    }
}, {
    tableName: 'chats', 
    timestamps: false, 
    underscored: true, 
});
    return Chat
};
