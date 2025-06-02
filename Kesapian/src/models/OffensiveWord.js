const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const OffensiveWord = sequelize.define('OffensiveWord', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        word: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW 
        },
        
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: true, 
            defaultValue: DataTypes.NOW 
        },
    }, {
        tableName: 'offensive_words',
        timestamps: true, 
        underscored: true,
    });

    return OffensiveWord;
};