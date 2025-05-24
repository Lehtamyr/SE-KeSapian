import React, { useState } from 'react';
import './Choosepref.css';

const tags = [
  'FPS', 'Gym', 'Music', 'Yoga',
  'Anime', 'Football', 'Moba', 'MMORPG',
  'Chill', 'RPG', 'Adventure', 'Relax',
  'Dance', 'Explore', 'Foodist', 'Mall'
];

const PreferencesPage: React.FC = () => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      setSelected(selected.filter(t => t !== tag));
    } else {
      setSelected([...selected, tag]);
    }
  };

  return (
    <div className="container">
      <button className="back-button">←</button>
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
      <button className="next-button">NEXT</button>
    </div>
  );
};

export default PreferencesPage;

