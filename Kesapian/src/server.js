
// server.js
const express = require('express');
const cors = require('cors');
const db = require('./database/db'); // sequelize instance
const { User } = require('./models'); // model User
const app = express();

app.use(cors());
app.use(express.json()); // parsing body JSON

// app.get('/', (req, res) => {
//     console.log('GET / request received'); 
//     res.send('Introvert App Backend is running');
// });

// Tes koneksi DB dan Sinkronisasi Model
db.authenticate()
    .then(() => {
        console.log('MySQL connected successfully.'); 
        // Sinkronkan model dengan database.
        // { force: true } akan MENGHAPUS dan membuat ulang tabel. 
        // { force: false } tidak akan membuat ulang tabel jika sudah ada.
        return db.sync({ force: false }); 
    })
    .then(() => console.log('Database synced! All models are now in sync with DB.')) 
    .catch((err) => console.error('DB connection or sync error:', err)); 

// Route Registrasi
app.post('/register', async (req, res) => {
    console.log('Received POST request to /register'); 
    console.log('Request body:', req.body); 

    const { email, username, password } = req.body;

    // validasi backend 
    if (!email || !username || !password) {
        console.error('Validation Error: Missing email, username, or password.');
        return res.status(400).json({ message: 'Email, username, and password are required.' });
    }

    try {

        const user = await User.create({
            email,
            username,
            password, 
            location: '', 
            preferences: null, 
            is_private: 1, 
        });

        console.log('User registered successfully:', user.username); 
        res.status(201).json({ message: 'User registered successfully', user: { id: user.id, username: user.username, email: user.email } }); 
    } catch (error) {
        console.error("Error during user registration:", error); 

        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0].path;
            console.error(`Attempt to register with existing ${field}: ${req.body[field]}`);
            return res.status(409).json({ message: `${field} already exists.` });
        }
        if (error.name === 'SequelizeValidationError') {
            console.error(`Validation error: ${error.errors[0].message}`);
            return res.status(400).json({ message: error.errors[0].message });
        }

        res.status(500).json({ message: 'Registration failed due to an unexpected server error.' });
    }
});

// Route Login
app.post('/login', async (req, res) => {
    console.log('Received POST request to /login');
    console.log('Request body:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        console.error('Login Validation Error: Missing email or password.');
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ where: { email: email } });

        if (!user) {
            console.warn('Login attempt with unregistered email:', email);
            return res.status(404).json({ message: 'Email not registered.' });
        }

        const isPasswordValid = (password === user.password); 

        if (!isPasswordValid) {
            console.warn('Login attempt with invalid password for email:', email);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        console.log('User logged in successfully:', user.username);
        res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email } });

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: 'Login failed due to an unexpected server error.' });
    }


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {

    console.log(`Server is running on port ${PORT}`);
    console.log('Backend ready to receive requests.');
});

