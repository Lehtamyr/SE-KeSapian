import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef, useCallback, memo } from "react";
import { io, Socket } from 'socket.io-client';
import L from 'leaflet';

import customMarkerIcon from '../assets/icons/marker-icon.png';

// Define interfaces for better type safety
interface FriendLocation {
    id: number;
    username: string;
    latitude: number;
    longitude: number;
    distance: string;
    last_updated: string | Date;
}

interface LocationUpdateData {
    latitude: number;
    longitude: number;
}

interface AuthData {
    userId: number;
    username: string;
    isPrivate: boolean;
    Location?: {
        latitude: number;
        longitude: number;
    };
}

interface LatLng {
    lat: number;
    lng: number;
}

// Define custom icon for the user's own position
const userPositionIcon = L.icon({
    iconUrl: customMarkerIcon,
    iconRetinaUrl: customMarkerIcon,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Define icon for friends
const friendIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const SOCKET_SERVER_URL = `http://${window.location.hostname}:3000`;

const LocationUpdater = ({ onLocationUpdate }: { onLocationUpdate: (latlng: LatLng) => void }) => {
    const map = useMapEvents({
        locationfound(e) {
            console.log("[LocationUpdater] Location found from browser:", e.latlng);
            onLocationUpdate(e.latlng);
            if (map.getCenter().distanceTo(e.latlng) > 100 || map.getZoom() < 16) {
                map.flyTo(e.latlng, map.getZoom() > 16 ? map.getZoom() : 16);
            }
        },
        locationerror(e: { message: string; code: number }) {
            console.error("[LocationUpdater] Location access denied or error:", e.message, "Code:", e.code);
            let errorMessage = "Tidak dapat mengakses lokasi Anda. Pastikan Anda mengizinkan akses lokasi di browser Anda.";
            if (e.code === 1) {
                errorMessage = "Anda menolak izin lokasi. Beberapa fitur mungkin tidak berfungsi dengan baik.";
            } else if (e.code === 2) {
                errorMessage = "Informasi lokasi tidak tersedia.";
            } else if (e.code === 3) {
                errorMessage = "Permintaan lokasi melebihi batas waktu.";
            }
            alert(errorMessage);
        }
    });

    useEffect(() => {
        console.log("[LocationUpdater] Requesting user location from browser...");
        map.locate({
            setView: false,
            maxZoom: 16,
            enableHighAccuracy: true
        });
    }, [map]);

    return null;
};

const MapBox = memo(({ authToken }: { authToken: string | null }) => {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [nearbyFriends, setNearbyFriends] = useState<FriendLocation[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Menghubungkan ke server...");
    const [showStatusMessage, setShowStatusMessage] = useState(true);

    const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];
    const DEFAULT_ZOOM = 13;

    const handleLocationUpdate = useCallback((latlng: LatLng) => {
        const newPosition: [number, number] = [latlng.lat, latlng.lng];
        setPosition(newPosition);
        setShowStatusMessage(false);

        if (socketRef.current && isConnected) {
            console.log('--- EMITTING UPDATE LOCATION FROM FRONTEND (Browser Geolocation) ---', { latitude: newPosition[0], longitude: newPosition[1] });
            socketRef.current.emit('updateLocation', {
                latitude: newPosition[0],
                longitude: newPosition[1]
            } as LocationUpdateData);
        } else {
            console.warn('[MapBox] Socket not connected or isConnected is false. Cannot emit updateLocation from browser.');
        }
    }, [isConnected]);

    useEffect(() => {
        const socket = io(SOCKET_SERVER_URL, {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Socket.IO] Connected to socket server');
            setIsConnected(true);
            setStatusMessage("Terhubung. Mencari lokasi Anda...");

            if (authToken) {
                socket.emit('authenticate', authToken);
            } else {
                console.warn('[Socket.IO] No authToken available for authentication during connect.');
                setStatusMessage("Tidak ada token autentikasi. Harap login.");
                if (!position) {
                    setPosition(DEFAULT_CENTER);
                }
                setShowStatusMessage(true);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket.IO] Disconnected from socket server:', reason);
            setIsConnected(false);
            setStatusMessage(`Terputus dari server: ${reason}`);
            setNearbyFriends([]);
            setShowStatusMessage(true);
        });

        socket.on('connect_error', (error) => {
            console.error('[Socket.IO] Socket connection error:', error.message);
            setIsConnected(false);
            setStatusMessage(`Gagal terhubung ke server: ${error.message}.`);
            alert(`Gagal terhubung ke server peta: ${error.message}. Pastikan server backend berjalan.`);
            if (!position) {
                setPosition(DEFAULT_CENTER);
            }
            setShowStatusMessage(true);
        });

        socket.on('authenticated', (data: AuthData) => {
            console.log('[Socket.IO] Authenticated:', data);
            if (data.Location && data.Location.latitude != null && data.Location.longitude != null) {
                setPosition([data.Location.latitude, data.Location.longitude]);
                setStatusMessage("Lokasi awal berhasil dimuat.");
                setShowStatusMessage(false);
            } else {
                setStatusMessage("Tidak ada lokasi awal. Mencari lokasi dari browser...");
                if (!position) {
                    setPosition(DEFAULT_CENTER);
                }
                setShowStatusMessage(true);
            }
        });

        socket.on('nearbyFriends', (friends: FriendLocation[]) => {
            console.log('[Socket.IO] Received nearby friends:', friends);
            setNearbyFriends(friends);
        });

        socket.on('friendMoved', (data: FriendLocation) => {
            console.log('[Socket.IO] Friend moved:', data);
            setNearbyFriends(prev => {
                const existingFriendIndex = prev.findIndex(friend => friend.id === data.id);
                if (existingFriendIndex > -1) {
                    const updatedFriends = [...prev];
                    updatedFriends[existingFriendIndex] = {
                        ...updatedFriends[existingFriendIndex],
                        latitude: data.latitude,
                        longitude: data.longitude,
                        distance: data.distance,
                        last_updated: data.last_updated
                    };
                    return updatedFriends;
                } else {
                    return [...prev, data];
                }
            });
        });

        socket.on('friendLeft', (userId: number) => {
            console.log(`[Socket.IO] Friend ${userId} left the area.`);
            setNearbyFriends(prev => prev.filter(friend => friend.id !== userId));
        });

        socket.on('authError', (message: string) => {
            console.error('[Socket.IO] Authentication error from server:', message);
            setStatusMessage(`Error autentikasi: ${message}`);
            alert(`Error autentikasi: ${message}`);
            setShowStatusMessage(true);
        });

        socket.on('locationError', (message: string) => {
            console.error('[Socket.IO] Location error from server:', message);
            setStatusMessage(`Error lokasi dari server: ${message}`);
            alert(`Error lokasi dari server: ${message}`);
            setShowStatusMessage(true);
        });

        return () => {
            console.log('[Socket.IO] Disconnecting socket on unmount...');
            socket.disconnect();
            socketRef.current = null;
        };
    }, [authToken]);

    const currentCenter = position || DEFAULT_CENTER;
    const currentZoom = position ? 15 : DEFAULT_ZOOM;
    const friendsToDisplay = nearbyFriends;

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            {showStatusMessage && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    zIndex: 1000,
                    fontSize: '0.8em'
                }}>
                    {statusMessage}
                </div>
            )}

            <MapContainer
                center={currentCenter}
                zoom={currentZoom}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <LocationUpdater onLocationUpdate={handleLocationUpdate} />

                {position && (
                    <Marker position={position} icon={userPositionIcon}>
                        <Popup>You are here</Popup>
                    </Marker>
                )}

                {friendsToDisplay.map(friend => (
                    <Marker
                        key={friend.id}
                        position={[friend.latitude, friend.longitude]}
                        icon={friendIcon}
                    >
                        <Popup>
                            <div>
                                <strong>{friend.username}</strong>
                                <p>{friend.distance}</p>
                                <small>Last updated: {new Date(friend.last_updated).toLocaleTimeString()}</small>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
});

export default MapBox;