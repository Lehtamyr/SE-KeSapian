<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Choosepref.css';

const tags = [
    'FPS', 'Gym', 'Music', 'Yoga',
    'Anime', 'Football', 'Moba', 'MMORPG',
    'Chill', 'RPG', 'Adventure', 'Relax',
    'Dance', 'Explore', 'Foodist', 'Mall'
];

const PreferencesPage: React.FC = () => {
    const [selected, setSelected] = useState<string[]>([]);
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        // Fetch existing preferences when the component mounts
        const fetchPreferences = async () => {
            if (!userId) {
                // User not logged in, handle accordingly (e.g., redirect to login)
                return;
            }
            try {
                const response = await fetch(`http://localhost:3000/profile/${userId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch user profile for preferences');
                }
                const data = await response.json();
                if (data.user && Array.isArray(data.user.preferences)) {
                    setSelected(data.user.preferences);
                }
            } catch (error) {
                console.error('Error fetching preferences:', error);
                alert('Failed to load existing preferences.');
            }
        };

        fetchPreferences();
    }, [userId]); 

    const toggleTag = (tag: string) => {
        if (selected.includes(tag)) {
            setSelected(selected.filter(t => t !== tag));
        } else {
            setSelected([...selected, tag]);
        }
    };

    const handleSubmitPreferences = async () => {
        if (!userId) {
            alert('User is not logged in. Please log in first.');
            navigate('/login');
            return;
        }

        if (selected.length === 0) {
            alert('Please select at least one preference.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: parseInt(userId), preferences: selected }),
            });

            if (!response.ok) {
                const errorData: { message?: string } = await response.json();
                throw new Error(errorData.message || 'Failed to save preferences');
            }

            const data: { message: string, user: { preferences: string[] } } = await response.json();
            alert(data.message);
            console.log('Preferences saved:', data);

            navigate('/profile'); 

        } catch (error: unknown) {
            console.error('Error saving preferences:', error);
            if (error instanceof Error) {
                alert('An error occurred while saving preferences: ' + error.message);
            } else {
                alert('An unknown error occurred while saving preferences.');
            }
        }
    };

    const handleBack = () => {
        navigate(-1); // Go back to the previous page (likely ProfilePage if coming from there)
    };

    return (
        <div className="container">
            <button className="back-button" onClick={handleBack}>←</button>
            <h1 className="title">Please Choose<br />Your Preferences</h1>
            <div className="tags-container">
                {tags.map(tag => (
                    <button
                        key={tag}
                        className={`tag-button ${selected.includes(tag) ? 'selected' : ''}`}
                        onClick={() => toggleTag(tag)}
                    >
                        {tag}
                    </button>
                ))}
            </div>
            <button className="next-button" onClick={handleSubmitPreferences}>NEXT</button>
        </div>
    );
};

export default PreferencesPage;
=======
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Choosepref.css';

const tags = [
    'FPS', 'Gym', 'Music', 'Yoga',
    'Anime', 'Football', 'Moba', 'MMORPG',
    'Chill', 'RPG', 'Adventure', 'Relax',
    'Dance', 'Explore', 'Foodist', 'Mall'
];

const PreferencesPage: React.FC = () => {
    const [selected, setSelected] = useState<string[]>([]);
    const navigate = useNavigate();

    const toggleTag = (tag: string) => {
        if (selected.includes(tag)) {
            setSelected(selected.filter(t => t !== tag));
        } else {
            setSelected([...selected, tag]);
        }
    };

    const handleSubmitPreferences = async () => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            alert('User is not logged in. Please log in first.');
            navigate('/login');
            return;
        }

        if (selected.length === 0) {
            alert('Please select at least one preference.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: parseInt(userId), preferences: selected }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save preferences');
            }

            const data = await response.json();
            alert(data.message);
            console.log('Preferences saved:', data);

            navigate('/chat');

        } catch (error: any) {
            console.error('Error saving preferences:', error);
            alert('An error occurred while saving preferences: ' + error.message);
        }
    };

    // Fungsi untuk kembali ke halaman sebelumnya 
    const handleBack = () => {
        navigate(-1); // Kembali ke halaman sebelumnya
    };

    return (
        <div className="container">
            <button className="back-button" onClick={handleBack}>←</button>
            <h1 className="title">Please Choose<br />Your Preferences</h1>
            <div className="tags-container">
                {tags.map(tag => (
                    <button
                        key={tag}
                        className={`tag-button ${selected.includes(tag) ? 'selected' : ''}`}
                        onClick={() => toggleTag(tag)}
                    >
                        {tag}
                    </button>
                ))}
            </div>
            <button className="next-button" onClick={handleSubmitPreferences}>NEXT</button>
        </div>
    );
};

export default PreferencesPage;
>>>>>>> ad9647da20c3bb7cbbd3363a20d70f7b2a640fe5
