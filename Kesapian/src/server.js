// server.js
const express = require('express');
const cors = require('cors');
const db = require('./database/db'); 
const { User, Friendship } = require('./models'); 
const { Op } = require('sequelize'); 
const app = express();

app.use(cors());
app.use(express.json()); 

// Tes koneksi DB dan Sinkronisasi Model
db.authenticate()
    .then(() => {
        console.log('MySQL connected successfully.');
        return db.sync({ alter: true }); 
    })
    .then(() => console.log('Database synced! All models are now in sync with DB.'))
    .catch((err) => console.error('DB connection or sync error:', err));
    
// Route Registrasi
app.post('/register', async (req, res) => {
    console.log('Received POST request to /register');
    console.log('Request body:', req.body);

    const { email, username, password } = req.body;

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
            is_private: true, 
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

        const isPasswordValid = (password === user.password); // Ingat: Gunakan bcrypt.compare() di produksi!

        if (!isPasswordValid) {
            console.warn('Login attempt with invalid password for email:', email);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        console.log('User logged in successfully:', user.username);
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                preferences: user.preferences // Kirim preferensi juga untuk cek di frontend
            }
        });

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: 'Login failed due to an unexpected server error.' });
    }
});

// Route update preferences 
app.post('/preferences', async (req, res) => {
    console.log('Received POST request to /preferences');
    console.log('Request body:', req.body);

    const { userId, preferences } = req.body;

    if (!userId || !preferences) {
        console.error('Validation Error: Missing userId or preferences.');
        return res.status(400).json({ message: 'User ID and preferences are required.' });
    }

    if (!Array.isArray(preferences)) {
        console.error('Validation Error: Preferences must be an array.');
        return res.status(400).json({ message: 'Preferences must be an array of strings.' });
    }

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            console.warn('Preferences update attempt for non-existent user ID:', userId);
            return res.status(404).json({ message: 'User not found.' });
        }

        await user.update({ preferences: preferences }); // Setter di model akan otomatis stringify array

        console.log(`Preferences updated successfully for user ID: ${userId}`);
        res.status(200).json({
            message: 'Preferences updated successfully',
            user: {
                id: user.id,
                username: user.username,
                preferences: user.preferences // Mengirim preferensi yang baru disimpan
            }
        });

    } catch (error) {
        console.error("Error updating preferences:", error);
        res.status(500).json({ message: 'Failed to update preferences due to an unexpected server error.' });
    }
});

// Route untuk searching user 
app.get('/search-user', async (req, res) => {
    console.log('Received GET request to /search-user');
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'Search query is required.' });
    }

    try {
        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { username: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } }
                ]
            },
            attributes: ['id', 'username', 'email'], // Hanya mengembalikan data yang aman
            limit: 10 // membatasi jumlah hasil
        });

        res.status(200).json({ users: users });

    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Failed to search users due to an unexpected server error.' });
    }
});

// Route Button AddFriend
app.post('/add-friend', async (req, res) => {
    console.log('Received POST request to /add-friend');
    console.log('Request body:', req.body);

    const { currentUserId, targetUserId } = req.body; // Menggunakan targetUserId (ID pengguna)

    if (!currentUserId || !targetUserId) {
        return res.status(400).json({ message: 'Current user ID and target user ID are required.' });
    }

    if (currentUserId === targetUserId) {
        return res.status(400).json({ message: 'Cannot add yourself as a friend.' });
    }

    try {
        const currentUser = await User.findByPk(currentUserId);
        const targetUser = await User.findByPk(targetUserId);

        if (!currentUser || !targetUser) {
            return res.status(404).json({ message: 'One or both users not found.' });
        }

        // mengecek apakah pertemanan/permintaan sudah ada (A->B atau B->A)
        const existingFriendship = await Friendship.findOne({
            where: {
                [Op.or]: [
                    { requesterId: currentUser.id, addresseeId: targetUser.id },
                    { requesterId: targetUser.id, addresseeId: currentUser.id }
                ]
            }
        });

        if (existingFriendship) {
            if (existingFriendship.status === 'pending') {
                if (existingFriendship.requesterId === currentUser.id) {
                    return res.status(409).json({ message: 'Friend request already sent to this user.' });
                } else {
                    return res.status(409).json({ message: 'This user has already sent you a friend request.' });
                }
            } else if (existingFriendship.status === 'accepted') {
                return res.status(409).json({ message: 'Already friends with this user.' });
            }
        }

        // Buat permintaan pertemanan baru
        await Friendship.create({
            requesterId: currentUser.id,
            addresseeId: targetUser.id,
            status: 'pending' 
        });

        res.status(200).json({ message: `Friend request sent to ${targetUser.username}.` });

    } catch (error) {
        console.error('Error adding friend:', error);
        res.status(500).json({ message: 'Failed to add friend due to an unexpected server error.' });
    }
});

// Route untuk mendapatkan daftar teman (yang sudah accepted)
app.get('/friends/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // menemukan semua Friendship di mana userId adalah requester atau addressee DAN statusnya 'accepted'
        const friendships = await Friendship.findAll({
            where: {
                [Op.or]: [
                    { requesterId: userId, status: 'accepted' },
                    { addresseeId: userId, status: 'accepted' }
                ]
            },
            // informasi User terkait (Requester dan Addressee)
            include: [
                { model: User, as: 'Requester', attributes: ['id', 'username', 'email'] },
                { model: User, as: 'Addressee', attributes: ['id', 'username', 'email'] }
            ]
        });

        const friendList = friendships.map(f => {
            if (f.requesterId == userId) { // Jika user ini yang mengirim permintaan
                return { id: f.Addressee.id, username: f.Addressee.username, email: f.Addressee.email };
            } else { // Jika user ini yang menerima permintaan
                return { id: f.Requester.id, username: f.Requester.username, email: f.Requester.email };
            }
        });

        res.status(200).json({ friends: friendList });

    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ message: 'Failed to fetch friends.' });
    }
});

// Route untuk mendapatkan detail profil pengguna 
app.get('/profile/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'location', 'preferences', 'is_private']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Failed to fetch user profile.' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Backend ready to receive requests.');
});