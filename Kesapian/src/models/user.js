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
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '',
        },
        preferences: {
            type: DataTypes.STRING, 
            allowNull: true,
            defaultValue: null,
            get() {
                const rawValue = this.getDataValue('preferences');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(value) {
                this.setDataValue('preferences', JSON.stringify(value));
            }
        },
        is_private: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 1,
        },
    }, {
        tableName: 'users', 
        timestamps: false 
    });

    return User; 
};