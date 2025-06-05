const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const { Op } = require('sequelize');
const geolib = require('geolib'); 
const { Sequelize } = require('sequelize'); 

const app = express();
const server = http.createServer(app);

const activeUsers = new Map(); 
const userPrivateStatus = new Map(); 
let offensiveWordsCache = []; 

dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize database connection
const db = require('./models');

// Import models 
const { User, UserLocation, Friendship, Chat, SuggestionText, OffensiveWord } = require('./models');

const MAX_DISTANCE_KM = 5; // Jarak maksimum dalam KM untuk teman terdekat

// Socket.IO server setup
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const tagToPreferenceIdMap = {
    'FPS': 1,
    'Gym': 2,
    'Music': 3,
    'Yoga': 4,
    'Anime': 5,
    'Football': 6,
    'Moba': 7,
    'MMORPG': 8,
    'Chill': 9,
    'RPG': 10,
    'Adventure': 11,
    'Relax': 12,
    'Dance': 13,
    'Explore': 14,
    'Foodist': 15,
    'Mall': 16,
};

// Express Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

async function loadOffensiveWords() {
    try {
        const words = await OffensiveWord.findAll({
            attributes: ['word']
        });
        offensiveWordsCache = new Set(words.map(w => w.word.toLowerCase()));
        console.log(`Offensive words cache loaded: ${offensiveWordsCache.size} words.`);
    } catch (error) {
        console.error('Failed to load offensive words cache:', error);
    }
}

// Fungsi untuk memeriksa pesan
function containsOffensiveWords(message) {
    const lowerCaseMessage = message.toLowerCase();
    for (const word of offensiveWordsCache) {
        // Menggunakan regex dengan word boundary untuk menghindari blokir kata di dalam kata lain
        // Contoh: 'kata' tidak akan memblokir 'katanya'
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        if (regex.test(lowerCaseMessage)) {
            return true; // Ditemukan kata ofensif
        }
    }
    return false; // Tidak ada kata ofensif
}

// Database connection and model synchronization
db.sequelize.authenticate()
    .then(() => {
        console.log('MySQL connected successfully.');
        return db.sequelize.sync({ alter: true }); 
    })
    .then(async () => {
        console.log('Database synchronized.');
        await loadOffensiveWords(); 
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

/**
 * Mengirim daftar teman terdekat ke pengguna yang ditentukan melalui socket.
 * @param {number} currentUserId - ID pengguna saat ini.
 * @param {object} socket - Objek socket.io untuk pengguna saat ini.
 */
async function sendNearbyFriends(currentUserId, socket) {
    try {
        console.log(`[sendNearbyFriends] Finding nearby friends for user ${currentUserId}`);

        const currentUserLocation = await UserLocation.findOne({
            where: { user_id: currentUserId }
        });

        if (!currentUserLocation || currentUserLocation.latitude === null || currentUserLocation.longitude === null) {
            console.log(`[sendNearbyFriends] No valid location found for user ${currentUserId}. Emitting empty nearbyFriends.`);
            socket.emit('nearbyFriends', []);
            return;
        }

        console.log(`[sendNearbyFriends] Current user location: ${currentUserLocation.latitude}, ${currentUserLocation.longitude}`);

        const friendships = await Friendship.findAll({
            where: {
                status: 'accepted',
                [Op.or]: [
                    { requesterId: currentUserId },
                    { addresseeId: currentUserId }
                ]
            },
            include: [
                {
                    model: User,
                    as: 'Requester',
                    include: [{
                        model: UserLocation,
                        as: 'userLocation'
                    }]
                },
                {
                    model: User,
                    as: 'Addressee',
                    include: [{
                        model: UserLocation,
                        as: 'userLocation'
                    }]
                }
            ]
        });

        console.log(`[sendNearbyFriends] Found ${friendships.length} accepted friendships for user ${currentUserId}.`);

        const nearbyFriends = [];

        for (const friendship of friendships) {
            const friend = friendship.Requester.id === currentUserId
                ? friendship.Addressee
                : friendship.Requester;

            // 1. Memastikan teman tidak private
            if (friend.is_private) {
                console.log(`[sendNearbyFriends] Skipping friend ${friend.id} (${friend.username}) - is private.`);
                continue;
            }
            // 2. Memastikan teman memiliki lokasi yang valid
            if (!friend.userLocation || friend.userLocation.latitude === null || friend.userLocation.longitude === null) {
                console.log(`[sendNearbyFriends] Skipping friend ${friend.id} (${friend.username}) - no valid userLocation found.`);
                continue;
            }
            // 3. Memastikan teman sedang aktif (terkoneksi dan terautentikasi ke Socket.IO)
            if (!activeUsers.has(friend.id)) {
                console.log(`[sendNearbyFriends] Skipping friend ${friend.id} (${friend.username}) - not currently active (online).`);
                continue;
            }

            const distance = geolib.getDistance(
                {
                    latitude: parseFloat(currentUserLocation.latitude),
                    longitude: parseFloat(currentUserLocation.longitude)
                },
                {
                    latitude: parseFloat(friend.userLocation.latitude),
                    longitude: parseFloat(friend.userLocation.longitude)
                }
            );

            if (distance <= MAX_DISTANCE_KM * 1000) { // Konversi km ke meter
                console.log(`[sendNearbyFriends] Friend ${friend.username} is nearby: ${(distance / 1000).toFixed(2)} km`);
                nearbyFriends.push({
                    id: friend.id,
                    username: friend.username,
                    latitude: parseFloat(friend.userLocation.latitude),
                    longitude: parseFloat(friend.userLocation.longitude),
                    distance: (distance / 1000).toFixed(2), // Format jarak ke 2 desimal
                    last_updated: friend.userLocation.last_updated
                });
            } else {
                console.log(`[sendNearbyFriends] Friend ${friend.username} is too far: ${(distance / 1000).toFixed(2)} km`);
            }
        }

        nearbyFriends.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        console.log(`[sendNearbyFriends] Emitting ${nearbyFriends.length} nearby friends to user ${currentUserId}`);
        socket.emit('nearbyFriends', nearbyFriends);

    } catch (error) {
        console.error('[sendNearbyFriends] Error fetching nearby friends:', error);
        socket.emit('locationError', 'Failed to fetch nearby friends.');
    }
}

// Get all users with their locations (for debugging/admin)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.findAll({
            include: [{
                model: UserLocation,
                as: 'userLocation',
                attributes: ['latitude', 'longitude', 'last_updated']
            }],
            attributes: ['id', 'username', 'email', 'is_private']
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users.', error: error.message });
    }
});

// Endpoint: Get nearby friends (accepted only) within 5km
app.get('/nearby-friends/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const currentUserLocation = await UserLocation.findOne({ where: { user_id: userId } });
        if (!currentUserLocation) return res.status(404).json({ message: 'User location not found.' });

        // Get accepted friendships only
        const friendships = await Friendship.findAll({
            where: {
                status: 'accepted',
                [Op.or]: [
                    { requesterId: userId },
                    { addresseeId: userId }
                ]
            }
        });

        // Get friend IDs
        const friendIds = friendships.map(f =>
            f.requesterId == userId ? f.addresseeId : f.requesterId
        );

        // Find all friends with location
        const users = await User.findAll({
            where: {
                id: { [Op.in]: friendIds },
                is_private: false
            },
            include: [{
                model: UserLocation,
                as: 'userLocation'
            }]
        });

        // Filter friends within 5km
        const result = [];
        users.forEach(user => {
            if (
                user.userLocation &&
                user.userLocation.latitude !== null &&
                user.userLocation.longitude !== null
            ) {
                const distance = geolib.getDistance(
                    {
                        latitude: parseFloat(currentUserLocation.latitude),
                        longitude: parseFloat(currentUserLocation.longitude)
                    },
                    {
                        latitude: parseFloat(user.userLocation.latitude),
                        longitude: parseFloat(user.userLocation.longitude)
                    }
                );
                if (distance <= MAX_DISTANCE_KM * 1000) {
                    result.push({
                        id: user.id,
                        username: user.username,
                        avatar: user.avatar || null,
                        latitude: user.userLocation.latitude,
                        longitude: user.userLocation.longitude,
                        distance: `${(distance / 1000).toFixed(2)}km from Your Position`
                    });
                }
            }
        });

        res.json({ users: result });
    } catch (err) {
        console.error('Error fetching nearby friends:', err);
        res.status(500).json({ message: 'Failed to fetch nearby friends.' });
    }
});

// Endpoint: Get nearby users who are NOT friends yet (and not self)
app.get('/nearby-users/:userId', async (req, res) => {
    const { userId } = req.params;

    // Ambil semua friendship accepted (teman) dan user itu sendiri
    const friendships = await Friendship.findAll({
        where: {
            status: 'accepted',
            [Op.or]: [
                { requesterId: userId },
                { addresseeId: userId }
            ]
        }
    });

    // mengumpulkan semua ID teman
    const relatedUserIds = new Set([parseInt(userId)]);
    friendships.forEach(f => {
        relatedUserIds.add(f.requesterId);
        relatedUserIds.add(f.addresseeId);
    });

    // mengambil lokasi user saat ini
    const currentUserLocation = await UserLocation.findOne({ where: { user_id: userId } });
    if (!currentUserLocation) return res.status(404).json({ message: 'User location not found.' });

    const users = await User.findAll({
        where: {
            id: { [Op.notIn]: Array.from(relatedUserIds) },
            is_private: false
        },
        include: [{
            model: UserLocation,
            as: 'userLocation'
        }]
    });

// Menambahkan filter: hanya user yang online (ada di activeUsers)
const onlineUsers = users.filter(user => activeUsers.has(user.id));

const result = [];
onlineUsers.forEach(user => {
    if (
        user.userLocation &&
        user.userLocation.latitude !== null &&
        user.userLocation.longitude !== null
    ) {
        const distance = geolib.getDistance(
            {
                latitude: parseFloat(currentUserLocation.latitude),
                longitude: parseFloat(currentUserLocation.longitude)
            },
            {
                latitude: parseFloat(user.userLocation.latitude),
                longitude: parseFloat(user.userLocation.longitude)
            }
        );
        if (distance <= MAX_DISTANCE_KM * 1000) {
            result.push({
                id: user.id,
                username: user.username,
                avatar: user.avatar || null,
                distance: `${(distance / 1000).toFixed(2)}km from Your Position`
            });
        }
    }
});
    res.json({ users: result });
});

// Route untuk mengubah status privasi lokasi user
app.put('/api/users/:userId/privacy', async (req, res) => {
    const { userId } = req.params;
    const { isPrivate } = req.body; 

    if (typeof isPrivate !== 'boolean') {
        return res.status(400).json({ message: 'isPrivate must be a boolean (true or false).' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update status is_private di database
        user.is_private = isPrivate;
        await user.save();

        // Update in-memory map untuk konsistensi real-time di server Socket.IO
        userPrivateStatus.set(user.id, user.is_private);
        console.log(`[API] User ${user.username} (ID: ${user.id}) privacy updated to ${isPrivate}.`);

        // Logika untuk memberitahu teman-teman jika status privasi berubah
        if (!isPrivate) { // Berubah dari private ke public
            if (activeUsers.has(user.id)) {
                const userSocketId = activeUsers.get(user.id);
                if (userSocketId) {
                    const socket = io.sockets.sockets.get(userSocketId);
                    if (socket) {
                        // Mengirimkan ulang daftar teman terdekat ke user ini
                        await sendNearbyFriends(user.id, socket);

                        // Memberitahu teman-teman yang aktif bahwa user ini sekarang terlihat
                        const currentUserLocation = await UserLocation.findOne({
                            where: { user_id: user.id }
                        });
                        if (currentUserLocation) {
                            const friendships = await Friendship.findAll({
                                where: {
                                    status: 'accepted',
                                    [Op.or]: [
                                        { requesterId: user.id },
                                        { addresseeId: user.id }
                                    ]
                                },
                                include: [{ model: UserLocation, as: 'userLocation' }] // Include friend's location
                            });

                            for (const friendship of friendships) {
                                const friendId = friendship.requesterId === user.id ? friendship.addresseeId : friendship.requesterId;
                                const friendUser = await User.findByPk(friendId, { include: [{ model: UserLocation, as: 'userLocation' }] });

                                if (friendUser && !friendUser.is_private && friendUser.userLocation && activeUsers.has(friendId)) {
                                    const distanceToFriend = geolib.getDistance(
                                        { latitude: parseFloat(currentUserLocation.latitude), longitude: parseFloat(currentUserLocation.longitude) },
                                        { latitude: parseFloat(friendUser.userLocation.latitude), longitude: parseFloat(friendUser.userLocation.longitude) }
                                    );
                                    io.to(`user_${friendId}`).emit('friendJoined', { // Emit 'friendJoined'
                                        id: user.id,
                                        username: user.username,
                                        latitude: parseFloat(currentUserLocation.latitude),
                                        longitude: parseFloat(currentUserLocation.longitude),
                                        distance: (distanceToFriend / 1000).toFixed(2),
                                        last_updated: currentUserLocation.last_updated
                                    });
                                    console.log(`[API] Emitted 'friendJoined' for user ${user.id} to active friend ${friendId} due to privacy change.`);
                                }
                            }
                        }
                    }
                }
            }
        } else { // Berubah dari public ke private
            // mengirimkan event 'friendLeft' ke semua teman yang sebelumnya bisa melihat user ini.
            const friendships = await Friendship.findAll({
                where: {
                    status: 'accepted',
                    [Op.or]: [
                        { requesterId: user.id },
                        { addresseeId: user.id }
                    ]
                }
            });

            for (const friendship of friendships) {
                const friendId = friendship.requesterId === user.id ? friendship.addresseeId : friendship.requesterId;
                const friendUser = await User.findByPk(friendId);

                // Memberi tahu teman yang aktif dan yang tidak private 
                if (friendUser && !friendUser.is_private && activeUsers.has(friendId)) {
                    io.to(`user_${friendId}`).emit('friendLeft', user.id);
                    console.log(`[API] Emitted 'friendLeft' for user ${user.id} to active friend ${friendId} due to privacy change to PRIVATE.`);
                }
            }
        }

        res.status(200).json({
            message: `User ${user.username} privacy updated to ${isPrivate ? 'private' : 'public'}.`,
            isPrivate: user.is_private
        });

    } catch (error) {
        console.error('[API] Error updating user privacy:', error);
        res.status(500).json({ message: 'Failed to update user privacy.', error: error.message });
    }
});

// Basic root route for server health check
app.get('/', (req, res) => {
    res.send('Socket.IO Location Server is running!');
});

// --- Socket.IO Logic for Real-time Location ---
io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);
    let authenticatedUserId = null; // Scope per koneksi

    // --- Authentication Event ---
    socket.on('authenticate', async (token) => {
        try {
            console.log(`[Socket:${socket.id}] Authentication attempt with token (username for demo): ${token}`);
            const user = await User.findOne({
                where: { username: token }, // Asumsi token adalah username untuk demo
                include: [{
                    model: UserLocation,
                    as: 'userLocation'
                }]
            });

            if (user) {
                authenticatedUserId = user.id; // Menyimpan ID user yang terautentikasi
                socket.join(`user_${authenticatedUserId}`); // Bergabung dengan room spesifik user

                activeUsers.set(authenticatedUserId, socket.id);
                userPrivateStatus.set(authenticatedUserId, user.is_private);

                console.log(`[Socket:${socket.id}] User ${authenticatedUserId} (${user.username}) authenticated successfully. is_private: ${user.is_private}`);

                const response = {
                    userId: authenticatedUserId,
                    username: user.username,
                    isPrivate: user.is_private, // Kirim status privasi ke frontend
                    Location: user.userLocation ? {
                        latitude: parseFloat(user.userLocation.latitude),
                        longitude: parseFloat(user.userLocation.longitude)
                    } : null
                };
                socket.emit('authenticated', response);
                console.log(`[Socket:${socket.id}] Sent 'authenticated' response with Location:`, response.Location, `isPrivate: ${response.isPrivate}`);

                // Jika user memiliki lokasi awal dari DB DAN TIDAK private, kirim teman terdekat segera
                if (user.userLocation && !user.is_private) {
                    console.log(`[Socket:${socket.id}] User has existing userLocation and is not private. Sending initial nearby friends.`);
                    await sendNearbyFriends(authenticatedUserId, socket);
                } else if (user.is_private) {
                    console.log(`[Socket:${socket.id}] User is private, not sending initial nearby friends.`);
                    socket.emit('nearbyFriends', []); // Kirim array kosong jika private
                } else {
                    console.log(`[Socket:${socket.id}] User has no existing userLocation. Frontend will request browser location.`);
                }
            } else {
                const errorMsg = 'Invalid authentication token (username).';
                console.log(`[Socket:${socket.id}] Authentication failed: ${errorMsg}`);
                socket.emit('authError', errorMsg);
                socket.disconnect(true); // Putuskan koneksi jika autentikasi gagal
            }
        } catch (error) {
            console.error(`[Socket:${socket.id}] Authentication error:`, error);
            socket.emit('authError', 'Authentication failed due to server error.');
            socket.disconnect(true);
        }
    });

    // --- Event to signal active status on specific page ---
    socket.on('setActive', async () => {
        if (!authenticatedUserId) {
            console.log(`[Socket:${socket.id}] setActive ignored: User not authenticated.`);
            return;
        }
       
        console.log(`[Socket:${socket.id}] User ${authenticatedUserId} signaled active on map page.`);

        const isCurrentUserPrivate = userPrivateStatus.get(authenticatedUserId);
        if (!isCurrentUserPrivate) {
            await sendNearbyFriends(authenticatedUserId, socket);

            const currentUserLocation = await UserLocation.findOne({ where: { user_id: authenticatedUserId } });
            if (currentUserLocation) {
                const friendships = await Friendship.findAll({
                    where: {
                        status: 'accepted',
                        [Op.or]: [{ requesterId: authenticatedUserId }, { addresseeId: authenticatedUserId }]
                    }
                });
                const emittingUser = await User.findByPk(authenticatedUserId);

                for (const friendship of friendships) {
                    const friendId = friendship.requesterId === authenticatedUserId ? friendship.addresseeId : friendship.requesterId;
                    const friendUser = await User.findByPk(friendId, { include: [{ model: UserLocation, as: 'userLocation' }] });

                    if (friendUser && !friendUser.is_private && friendUser.userLocation && activeUsers.has(friendId)) {
                        const distanceToFriend = geolib.getDistance(
                            { latitude: parseFloat(currentUserLocation.latitude), longitude: parseFloat(currentUserLocation.longitude) },
                            { latitude: parseFloat(friendUser.userLocation.latitude), longitude: parseFloat(friendUser.userLocation.longitude) }
                        );
                        if (distanceToFriend <= MAX_DISTANCE_KM * 1000) {
                            io.to(`user_${friendId}`).emit('friendJoined', {
                                id: authenticatedUserId,
                                username: emittingUser ? emittingUser.username : `User ${authenticatedUserId}`,
                                latitude: parseFloat(currentUserLocation.latitude),
                                longitude: parseFloat(currentUserLocation.longitude),
                                distance: (distanceToFriend / 1000).toFixed(2),
                                last_updated: currentUserLocation.last_updated
                            });
                            console.log(`[Socket:${socket.id}] Emitted 'friendJoined' for user ${authenticatedUserId} to active friend ${friendId} on setActive.`);
                        }
                    }
                }
            }
        } else {
             console.log(`[Socket:${socket.id}] User ${authenticatedUserId} is private, setActive will not broadcast location.`);
        }
    });

    // --- Event to signal inactive status when leaving the page ---
    socket.on('setInactive', () => {
        if (!authenticatedUserId) {
            console.log(`[Socket:${socket.id}] setInactive ignored: User not authenticated.`);
            return;
        }
        
        console.log(`[Socket:${socket.id}] User ${authenticatedUserId} signaled INACTIVE on map page.`);

        const isCurrentUserPrivate = userPrivateStatus.get(authenticatedUserId);
        if (!isCurrentUserPrivate) {
            Friendship.findAll({
                where: {
                    status: 'accepted',
                    [Op.or]: [{ requesterId: authenticatedUserId }, { addresseeId: authenticatedUserId }]
                }
            }).then(friendships => {
                friendships.forEach(friendship => {
                    const friendId = friendship.requesterId === authenticatedUserId ? friendship.addresseeId : friendship.requesterId;
                    User.findByPk(friendId).then(friendUser => {
                        if (friendUser && !friendUser.is_private && activeUsers.has(friendId)) { // Hanya ke teman yang aktif dan tidak private
                            io.to(`user_${friendId}`).emit('friendLeft', authenticatedUserId);
                            console.log(`[Socket] Emitted 'friendLeft' for user ${authenticatedUserId} to active friend ${friendId} due to setInactive.`);
                        }
                    }).catch(error => {
                        console.error(`[Socket:${socket.id}] Error finding friend user on setInactive for friend ${friendId}:`, error);
                    });
                });
            }).catch(error => {
                console.error(`[Socket:${socket.id}] Error fetching friendships on setInactive:`, error);
            });
        }
    });

    // --- Location Update Event ---
    socket.on('updateLocation', async (data) => {
        if (!authenticatedUserId) {
            console.log(`[Socket:${socket.id}] Location update ignored: User not authenticated.`);
            return socket.emit('locationError', 'Authentication required to update location.');
        }

        // Mengecek apakah user terautentikasi dan terdaftar sebagai "aktif"
        if (!activeUsers.has(authenticatedUserId)) {
            console.log(`[Socket:${socket.id}] Location update ignored: User ${authenticatedUserId} is not currently active (socket not registered).`);
            return socket.emit('locationError', 'You are not actively connected or authenticated to share location.');
        }

        const { latitude, longitude } = data;

        if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
            console.log(`[Socket:${socket.id}] Invalid location data: latitude=${latitude}, longitude=${longitude}`);
            return socket.emit('locationError', 'Invalid latitude or longitude format.');
        }

        try {
            const [userLocation, created] = await UserLocation.upsert({
                user_id: authenticatedUserId,
                latitude: latitude,
                longitude: longitude,
                last_updated: new Date(),
            });
            console.log(`[Socket:${socket.id}] User ${authenticatedUserId} location ${created ? 'inserted' : 'updated'}: ${latitude}, ${longitude}`);

            // Mengambil status privasi user saat ini dari in-memory map
            const isCurrentUserPrivate = userPrivateStatus.get(authenticatedUserId);

            if (isCurrentUserPrivate) {
                console.log(`[Socket:${socket.id}] User ${authenticatedUserId} is private, not broadcasting location to friends.`);
                await sendNearbyFriends(authenticatedUserId, socket);
                return socket.emit('locationError', 'Your location is set to private. Please change your privacy settings to share.');
            }

            // Jika user tidak private, lanjutkan proses broadcast
            await sendNearbyFriends(authenticatedUserId, socket);

            // Mengambil semua pertemanan yang diterima di mana user ini terlibat
            const friendships = await Friendship.findAll({
                where: {
                    status: 'accepted',
                    [Op.or]: [
                        { requesterId: authenticatedUserId },
                        { addresseeId: authenticatedUserId }
                    ]
                }
            });

            const emittingUser = await User.findByPk(authenticatedUserId); // Mendapatkan detail user yang mengupdate lokasi

            for (const friendship of friendships) {
                const friendId = friendship.requesterId === authenticatedUserId
                    ? friendship.addresseeId
                    : friendship.requesterId;

                const friendUser = await User.findByPk(friendId, {
                    include: [{ model: UserLocation, as: 'userLocation' }]
                });

                // Hanya broadcast jika teman ada, tidak private, memiliki lokasi yang valid, dan teman sedang aktif (online)
                if (friendUser && !friendUser.is_private && friendUser.userLocation && friendUser.userLocation.latitude !== null && friendUser.userLocation.longitude !== null && activeUsers.has(friendId)) {
                    const distanceToFriend = geolib.getDistance(
                        { latitude, longitude },
                        { latitude: parseFloat(friendUser.userLocation.latitude), longitude: parseFloat(friendUser.userLocation.longitude) }
                    );

                    io.to(`user_${friendId}`).emit('friendMoved', {
                        id: authenticatedUserId, // ID pengguna yang bergerak
                        username: emittingUser ? emittingUser.username : `User ${authenticatedUserId}`,
                        latitude: latitude,
                        longitude: longitude,
                        distance: (distanceToFriend / 1000).toFixed(2), // Jarak ke teman
                        last_updated: new Date() // Menggunakan waktu saat ini untuk update broadcast
                    });
                    console.log(`[Socket:${socket.id}] Emitted 'friendMoved' for user ${authenticatedUserId} to friend ${friendId}`);
                } else {
                    // Log mengapa broadcast tidak dilakukan
                    if (friendUser && friendUser.is_private) {
                        console.log(`[Socket:${socket.id}] Skipping 'friendMoved' for friend ${friendId} (${friendUser.username}) - is private.`);
                    } else if (!friendUser) {
                        console.log(`[Socket:${socket.id}] Skipping 'friendMoved' for friend ${friendId} - user not found.`);
                    } else if (!friendUser.userLocation || friendUser.userLocation.latitude === null) {
                        console.log(`[Socket:${socket.id}] Skipping 'friendMoved' for friend ${friendId} (${friendUser.username}) - no valid location.`);
                    } else if (!activeUsers.has(friendId)) {
                        console.log(`[Socket:${socket.id}] Skipping 'friendMoved' for friend ${friendId} (${friendUser.username}) - friend is not active.`);
                    }
                }
            }

        } catch (error) {
            console.error(`[Socket:${socket.id}] Error updating location or broadcasting:`, error);
            socket.emit('locationError', 'Failed to update location or notify friends.');
        }
    });

    // --- Disconnect Event ---
    socket.on('disconnect', async (reason) => {
        console.log(`[Socket] User disconnected: ${socket.id}. Reason: ${reason}`);
        if (authenticatedUserId) {
            activeUsers.delete(authenticatedUserId); 
            userPrivateStatus.delete(authenticatedUserId); 
            socket.leave(`user_${authenticatedUserId}`);
            console.log(`[Socket] User ${authenticatedUserId} left room user_${authenticatedUserId} and removed from activeMaps.`);

            const isCurrentUserPrivate = userPrivateStatus.get(authenticatedUserId); // Mendapatkan status terakhir

            // Memberi tahu teman jika user TIDAK private saat disconnect
            if (!isCurrentUserPrivate) {
                const friendships = await Friendship.findAll({
                    where: {
                        status: 'accepted',
                        [Op.or]: [
                            { requesterId: authenticatedUserId },
                            { addresseeId: authenticatedUserId }
                        ]
                    }
                });

                // Menggunakan Promise.all untuk menunggu semua lookup dan emit
                await Promise.all(friendships.map(async (friendship) => {
                    const friendId = friendship.requesterId === authenticatedUserId
                        ? friendship.addresseeId
                        : friendship.requesterId;

                    const friendUser = await User.findByPk(friendId);
                    // Memberi tahu jika teman juga aktif dan tidak private
                    if (friendUser && !friendUser.is_private && activeUsers.has(friendId)) {
                        io.to(`user_${friendId}`).emit('friendLeft', authenticatedUserId);
                        console.log(`[Socket] Emitted 'friendLeft' for user ${authenticatedUserId} to active friend ${friendId} due to disconnect.`);
                    }
                }));
            }
        }
    });
});

// dapat info profile chatPerson
app.get('/users/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Mengambil detail user dari database berdasarkan ID
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'password', 'preferences', 'is_private']
        });

        if (!user) {
            // Jika user tidak ditemukan
            return res.status(404).json({ message: 'User not found.' });
        }

        // Mengembalikan detail user yang ditemukan
        res.status(200).json(user);

    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Failed to fetch user details.' });
    }
});

// socket io chattting
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinChat', (userId) => {
        socket.join(userId.toString()); // Setiap user bergabung ke room dengan ID mereka sendiri
        console.log(`User ${userId} joined room ${userId}`);
    });

    socket.on('sendMessage', async (data) => {
        console.log(`[DEBUG_SOCKET_RECEIVE] Event 'sendMessage' diterima. Data:`, data);
        const { senderId, receiverId, message } = data;
        console.log(`Pesan dari ${senderId} ke ${receiverId}: ${message}`);

        try {
            if (offensiveWordsCache.size === 0) {
                console.warn('[WARNING] Offensive words cache kosong. Deteksi kata kasar mungkin tidak berfungsi.');
            }

            console.log('[DEBUG] Jumlah kata kasar di cache:', offensiveWordsCache.size);

            const lowerCaseMessage = message.toLowerCase();
            const isOffensive = Array.from(offensiveWordsCache).some(offensiveWord =>
                lowerCaseMessage.includes(offensiveWord)
            );

            if (isOffensive) {
                console.log(`[OFFENSIVE DETECTED] Pesan dari ${senderId} mengandung kata kasar: "${message}"`);
                socket.emit('offensiveWordDetected', { message: 'Pesan Anda mengandung kata-kata tidak pantas.' });
                return;
            }

            // Jika pesan tidak kasar, lanjutkan proses penyimpanan dan pengiriman
            const newMessage = await Chat.create({
                sender_id: senderId,
                receiver_id: receiverId,
                message: message,
                timestamp: new Date(),
            });

            // Kirim pesan ke pengirim dan penerima
            io.to(senderId.toString()).emit('newMessage', {
                id: newMessage.id,
                senderId: newMessage.sender_id,
                receiverId: newMessage.receiver_id,
                messageText: newMessage.message,
                timestamp: newMessage.timestamp.toISOString(),
            });

            if (senderId !== receiverId) { // Jangan kirim ke diri sendiri dua kali
                io.to(receiverId.toString()).emit('newMessage', {
                    id: newMessage.id,
                    senderId: newMessage.sender_id,
                    receiverId: newMessage.receiver_id,
                    messageText: newMessage.message,
                    timestamp: newMessage.timestamp.toISOString(),
                });
            }

            console.log('Pesan berhasil disimpan dan dikirim via Socket.IO');

        } catch (error) {
            console.error('Error handling message:', error);
            socket.emit('sendMessageError', { message: 'Gagal mengirim pesan.' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Endpoint untuk mengambil riwayat chat
app.get('/messages/:currentUserId/:partnerId', async (req, res) => {
    const { currentUserId, partnerId } = req.params;
    try {
        const messages = await Chat.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { sender_id: currentUserId, receiver_id: partnerId },
                    { sender_id: partnerId, receiver_id: currentUserId }
                ]
            },
            order: [['timestamp', 'ASC']],
            attributes: [
                'id',
                ['sender_id', 'senderId'],     
                ['receiver_id', 'receiverId'], 
                ['message', 'messageText'],    
                'timestamp'
            ]
        });
        res.json(messages);
    } catch (error) {
        console.error('Error fetching chat history from DB:', error);
        res.status(500).json({ error: 'Failed to fetch chat history from database.' });
    }
});

// Endpoint untuk mengirim pesan
app.post('/messages', async (req, res) => {
    const { senderId, receiverId, messageText } = req.body;
    if (!senderId || !receiverId || !messageText) {
        return res.status(400).json({ error: 'Missing required message fields.' });
    }

    try {
        if (containsOffensiveWords(messageText)) {
            console.warn(`[HTTP POST] Pesan dari ${senderId} mengandung kata kasar dan diblokir: "${messageText}"`);
            return res.status(400).json({ error: 'Pesan Anda mengandung kata-kata tidak pantas.' });
        }

        const newMessage = await Chat.create({
            sender_id: senderId,
            receiver_id: receiverId,
            message: messageText,
            timestamp: new Date(),
        });

        const formattedMessage = {
            id: newMessage.id,
            senderId: newMessage.sender_id,
            receiverId: newMessage.receiver_id,
            messageText: newMessage.message,
            timestamp: newMessage.timestamp.toISOString(),
        };

        io.to(senderId.toString()).emit('newMessage', formattedMessage); // Kirim ke pengirim (untuk update UI mereka sendiri secara real-time)
        io.to(receiverId.toString()).emit('newMessage', formattedMessage); // Kirim ke penerima

        res.status(201).json(formattedMessage);
    } catch (error) {
        console.error('Error sending message to DB:', error);
        res.status(500).json({ error: 'Failed to send message to database.' });
    }
});

// Endpoint baru untuk mendapatkan saran chat berdasarkan preferensi user
app.get('/api/suggestions/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        let userTags = [];
        if (user.preferences) {
            userTags = user.preferences; 
            if (!Array.isArray(userTags)) { 
                userTags = [];
            }
        }

        const preferenceIds = new Set();
        userTags.forEach(tag => {
            if (tagToPreferenceIdMap[tag]) {
                preferenceIds.add(tagToPreferenceIdMap[tag]);
            }
        });

        if (preferenceIds.size === 0) {
            return res.json({ suggestions: [] });
        }

        const suggestions = await SuggestionText.findAll({
            where: {
                preference_id: {
                    [Op.in]: Array.from(preferenceIds)
                }
            },
            attributes: ['suggestion_text']
        });

        const uniqueSuggestions = [...new Set(suggestions.map(s => s.suggestion_text))];

        res.json({ suggestions: uniqueSuggestions });

    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({ message: 'Failed to fetch suggestions.', error: error.message });
    }
});

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

        const isPasswordValid = (password === user.password); 

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
                preferences: user.preferences 
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

// Route untuk update username dan location
app.put('/profile/:userId', async (req, res) => {
    console.log('Received PUT request to /profile/:userId');
    const { userId } = req.params;
    const { username, is_private } = req.body; // Changed from location to is_private

    if (username === undefined && is_private === undefined) { // Check for both fields
        return res.status(400).json({ message: 'At least username or is_private status is required for update.' });
    }

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const updateFields = {};
        if (username !== undefined) {
            updateFields.username = username;
        }
        if (is_private !== undefined) {
            // Ensure is_private is stored as 0 or 1 in the database if your column is TINYINT(1) or similar
            updateFields.is_private = is_private ? 1 : 0;
        }

        await user.update(updateFields);

        console.log(`User profile updated successfully for user ID: ${userId}`);
        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_private: user.is_private, // Return the updated is_private
                preferences: user.preferences
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0].path;
            return res.status(409).json({ message: `${field} already exists.` });
        }
        res.status(500).json({ message: 'Failed to update profile due to an unexpected server error.' });
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

// Add this endpoint in server.js
app.get('/api/users_by_preferences', async (req, res) => {
    const { userId, preferences } = req.query;

    if (!userId || !preferences) {
        return res.status(400).json({ message: 'User ID and preferences are required.' });
    }

    try {
        // Parse preferences (it's a comma-separated string from query params)
        const prefArray = Array.isArray(preferences) ? preferences : preferences.split(',');

        // Get current user's friends (to exclude them)
        const friendships = await db.Friendship.findAll({
            where: {
                [Op.or]: [
                    { requesterId: userId },
                    { addresseeId: userId }
                ]
            }
        });

        const friendIds = friendships.map(f => 
            f.requesterId == userId ? f.addresseeId : f.requesterId
        );

        // Find users who have at least one of the selected preferences
        const users = await db.User.findAll({
            where: {
                id: {
                    [Op.notIn]: [userId, ...friendIds] // Exclude self and friends
                },
                is_private: false,
                [Op.or]: prefArray.map(pref => ({
                    preferences: {
                        [Op.like]: `%${pref}%`
                    }
                }))
            },
            include: [{
                model: db.UserLocation,
                as: 'userLocation'
            }],
            attributes: ['id', 'username', 'email']
        });

        // Filter to only show online users (optional)
        const onlineUsers = users.filter(user => activeUsers.has(user.id));

        res.json({ users: onlineUsers });
    } catch (error) {
        console.error('Error fetching users by preferences:', error);
        res.status(500).json({ message: 'Failed to fetch users by preferences.' });
    }
});

// Route untuk mendapatkan detail profil pengguna
app.get('/profile/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'preferences', 'is_private']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Parse preferences if they are stored as a stringified JSON array
        let userPreferences = user.preferences;
        if (typeof userPreferences === 'string') {
            try {
                userPreferences = JSON.parse(userPreferences);
            } catch (parseError) {
                console.error("Error parsing preferences for user:", userId, parseError);
                userPreferences = []; // Default to empty array if parsing fails
            }
        }
        // Ensure preferences is an array, even if null/empty from DB
        userPreferences = Array.isArray(userPreferences) ? userPreferences : [];


        res.status(200).json({ user: {
            id: user.id,
            username: user.username,
            email: user.email,
            location: user.location,
            preferences: userPreferences, // Send parsed preferences
            is_private: user.is_private
        } });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Failed to fetch user profile.' });
    }
});

// Route untuk mendapatkan daftar permintaan pertemanan yang masuk (pending)
app.get('/friend-requests/:userId', async (req, res) => {
    console.log('Received GET request to /friend-requests/:userId');
    const { userId } = req.params;

    try {
        const friendRequests = await Friendship.findAll({
            where: {
                addresseeId: userId, // User ini adalah penerima permintaan
                status: 'pending'
            },
            include: [
                { model: User, as: 'Requester', attributes: ['id', 'username', 'email'] }
            ]
        });

        const incomingRequests = friendRequests.map(request => ({
            id: request.id, // ID dari record Friendship
            requesterId: request.Requester.id,
            requesterUsername: request.Requester.username,
            requesterEmail: request.Requester.email,
            status: request.status
        }));

        res.status(200).json({ incomingRequests: incomingRequests });

    } catch (error) {
        console.error('Error fetching incoming friend requests:', error);
        res.status(500).json({ message: 'Failed to fetch incoming friend requests.' });
    }
});

// Route untuk menerima atau menolak permintaan pertemanan
app.post('/respond-friend-request', async (req, res) => {
    console.log('Received POST request to /respond-friend-request');
    console.log('Request body:', req.body);

    const { requestId, action } = req.body; // action bisa 'accept' atau 'reject'

    if (!requestId || !action || !['accept', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Friendship request ID and a valid action (accept/reject) are required.' });
    }

    try {
        const friendship = await Friendship.findByPk(requestId);

        if (!friendship) {
            return res.status(404).json({ message: 'Friendship request not found.' });
        }

        if (friendship.status !== 'pending') {
            return res.status(400).json({ message: 'Friendship request is no longer pending.' });
        }

        if (action === 'accept') {
            await friendship.update({ status: 'accepted' });
            // menambahkan notifikasi real-time ke requester di sini
            res.status(200).json({ message: 'Friend request accepted successfully.' });
        } else if (action === 'reject') {
            await friendship.destroy(); // Hapus permintaan jika ditolak
            // menambahkan notifikasi real-time ke requester di sini
            res.status(200).json({ message: 'Friend request rejected successfully.' });
        }

    } catch (error) {
        console.error('Error responding to friend request:', error);
        res.status(500).json({ message: 'Failed to respond to friend request due to an unexpected server error.' });
    }
});

// Group Routes
app.post('/api/groups', async (req, res) => {
  const { name, description, created_by, is_private, members } = req.body;

  try {
    const group = await db.Group.create({
      name,
      description,
      created_by,
      is_private
    });

    // Add creator as admin
    await db.GroupMember.create({
      group_id: group.id,
      user_id: created_by,
      role: 'admin'
    });

    // Add other members
    if (members && members.length > 0) {
      const memberPromises = members.map(userId => 
        db.GroupMember.create({
          group_id: group.id,
          user_id: userId,
          role: 'member'
        })
      );
      await Promise.all(memberPromises);
    }

    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Failed to create group' });
  }
});

app.get('/api/groups/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const groups = await db.GroupMember.findAll({
      where: { user_id: userId },
      include: [
        {
          model: db.Group,
          as: 'group',
          include: [
            {
              model: db.GroupMessage,
              as: 'messages',
              order: [['created_at', 'DESC']],
              limit: 1
            },
            {
              model: db.GroupMember,
              as: 'members',
              include: [
                {
                  model: db.User,
                  as: 'user',
                  attributes: ['id', 'username']
                }
              ]
            }
          ]
        }
      ]
    });

    res.json(groups.map(gm => gm.group));
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
});

app.get('/api/group-messages/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    const messages = await db.GroupMessage.findAll({
      where: { group_id: groupId },
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'username']
        }
      ],
      order: [['created_at', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ message: 'Failed to fetch group messages' });
  }
});

// --- Group Message: POST & Emit with sender info ---
app.post('/api/group-messages', async (req, res) => {
  const { group_id, sender_id, message } = req.body;

  try {
    if (containsOffensiveWords(message)) {
      return res.status(400).json({ error: 'Message contains offensive words' });
    }

    const newMessage = await db.GroupMessage.create({
      group_id,
      sender_id,
      message
    });

    // Ambil data user pengirim (username)
    const senderUser = await db.User.findByPk(sender_id, {
      attributes: ['id', 'username']
    });

    // Format pesan lengkap (seperti GET)
    const msgWithSender = {
      id: newMessage.id,
      group_id: newMessage.group_id,
      sender_id: newMessage.sender_id,
      message: newMessage.message,
      is_pinned: newMessage.is_pinned,
      created_at: newMessage.created_at,
      sender: senderUser ? { id: senderUser.id, username: senderUser.username } : null
    };

    // Emit ke semua member group
    io.to(`group_${group_id}`).emit('newGroupMessage', msgWithSender);

    // Notifikasi ke user 
    const groupMembers = await db.GroupMember.findAll({
      where: { group_id },
      attributes: ['user_id']
    });
    const memberIds = groupMembers.map(m => m.user_id);
    memberIds.forEach(userId => {
      io.to(`user_${userId}`).emit('newGroupMessageNotification', {
        group_id,
        message: newMessage.message,
        sender_id: newMessage.sender_id
      });
    });

    res.status(201).json(msgWithSender);
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({ message: 'Failed to send group message' });
  }
});

// --- Pin Message Group ---
app.post('/api/pin-message', async (req, res) => {
  const { message_id, group_id } = req.body;

  try {
    const msg = await db.GroupMessage.findByPk(message_id, {
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'username']
        }
      ]
    });
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    // Unpin semua pesan di group ini
    await db.GroupMessage.update({ is_pinned: false }, { where: { group_id } });

    // Toggle pin/unpin pesan ini
    msg.is_pinned = !msg.is_pinned;
    await msg.save();

    // Emit ke group: update status pinned di FE
    io.to(`group_${group_id}`).emit('messagePinned', {
      id: msg.id,
      group_id: msg.group_id,
      sender_id: msg.sender_id,
      message: msg.message,
      is_pinned: msg.is_pinned,
      created_at: msg.created_at,
      sender: msg.sender ? { id: msg.sender.id, username: msg.sender.username } : null
    });

    res.json({ success: true, message: msg.is_pinned ? 'Message pinned' : 'Message unpinned', data: msg });
  } catch (error) {
    console.error('Error pinning/unpinning message:', error);
    res.status(500).json({ message: 'Failed to pin/unpin message' });
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  socket.on('joinGroup', (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`User joined group room: group_${groupId}`);
  });

  socket.on('leaveGroup', (groupId) => {
    socket.leave(`group_${groupId}`);
    console.log(`User left group room: group_${groupId}`);
  });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Backend ready to receive requests.');
});