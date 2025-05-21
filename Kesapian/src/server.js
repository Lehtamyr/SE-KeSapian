const express = require('express');
const cors = require('cors');
const db = require('./database/db');
const { User } = require('./models');
// const bcrypt = require('bcrypt');
// const hashedPassword = await bcrypt.hash(password, 10);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Introvert App Backend is running');
});

// Tes koneksi DB
db.authenticate()
    .then(() => console.log('MySQL connected'))
    .catch((err) => console.error('DB connection error:', err));

app.post('/register', async (req, res) => {
  const { email, username, password } = req.body;

  try {
    // hash password
    // const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      username,
      password,
      //   password: hashedPassword,
      location: '',         // kosong
      preferences: null,    // null
      is_private: 1,        // default private
    });

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed', error });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
