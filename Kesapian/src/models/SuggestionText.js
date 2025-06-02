const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SuggestionText = sequelize.define('suggestion_text', { 
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        preference_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        suggestion_text: {
            type: DataTypes.TEXT, 
            allowNull: false,
        },
    }, {
        // Opsi model
        tableName: 'suggestion_chat_starters', 
        timestamps: false, 
    });

    return SuggestionText;
};