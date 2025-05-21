module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
  username: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING,
  location: DataTypes.STRING,
  preferences: DataTypes.TEXT,
  is_private: DataTypes.BOOLEAN,
}, {
  timestamps: false, // ← ini tempat yang benar
});
  return User;
};
