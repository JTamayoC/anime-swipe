"use client";

import React, { useState, useEffect } from 'react';
import { Heart, X, RotateCcw } from 'lucide-react';

export default function AnimeSwipeApp() {
  const [animeList, setAnimeList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [likedAnime, setLikedAnime] = useState([]);
  const [dislikedAnime, setDislikedAnime] = useState([]);

  // Fake anime data for testing
  const fakeAnimeData = [
    {
      mal_id: 1,
      title: "Dragon Chronicles",
      images: { jpg: { large_image_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&h=700&fit=crop" }},
      score: 8.5,
      type: "TV",
      episodes: 24,
      synopsis: "A young warrior discovers their hidden power to control dragons and must save their kingdom from an ancient evil that threatens to destroy everything they hold dear."
    },
    {
      mal_id: 2,
      title: "Cyber City 2099",
      images: { jpg: { large_image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&h=700&fit=crop" }},
      score: 9.1,
      type: "TV",
      episodes: 12,
      synopsis: "In a neon-lit future metropolis, a hacker uncovers a conspiracy that could change the fate of humanity forever. Action-packed cyberpunk thriller with stunning visuals."
    },
    {
      mal_id: 3,
      title: "Magical Academy",
      images: { jpg: { large_image_url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&h=700&fit=crop" }},
      score: 7.8,
      type: "TV",
      episodes: 36,
      synopsis: "Students at an elite magic school compete in tournaments while uncovering dark secrets about their institution's past. Friendship, rivalry, and supernatural powers collide."
    },
    {
      mal_id: 4,
      title: "Samurai Legends",
      images: { jpg: { large_image_url: "https://images.unsplash.com/photo-1528409343470-c9a804e0b6e1?w=500&h=700&fit=crop" }},
      score: 8.9,
      type: "Movie",
      episodes: 1,
      synopsis: "A masterless samurai roams feudal Japan seeking redemption for past sins. Breathtaking sword fights and emotional storytelling create an unforgettable tale of honor."
    },
    {
      mal_id: 5,
      title: "Space Explorers",
      images: { jpg: { large_image_url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500&h=700&fit=crop" }},
      score: 8.2,
      type: "TV",
      episodes: 48,
      synopsis: "A ragtag crew of space travelers embarks on a journey across the galaxy, encountering alien civilizations and facing cosmic mysteries that challenge their understanding of reality."
    },
    {
      mal_id: 6,
      title: "Demon Slayer Academy",
      images: { jpg: { large_image_url: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=500&h=700&fit=crop" }},
      score: 8.7,
      type: "TV",
      episodes: 24,
      synopsis: "Young demon hunters train to protect humanity from supernatural threats. Dark fantasy with intense battles and deep character development."
    },
    {
      mal_id: 7,
      title: "Cooking Masters",
      images: { jpg: { large_image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=700&fit=crop" }},
      score: 7.5,
      type: "TV",
      episodes: 12,
      synopsis: "Aspiring chefs compete in high-stakes culinary battles where dishes can literally change the world. A delicious blend of comedy, drama, and mouth-watering food."
    },
    {
      mal_id: 8,
      title: "Time Loop Paradox",
      images: { jpg: { large_image_url: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=500&h=700&fit=crop" }},
      score: 9.3,
      type: "TV",
      episodes: 13,
      synopsis: "A high school student finds themselves trapped in a time loop, reliving the same day. They must solve the mystery while preventing a catastrophic future."
    }
  ];

  // Fetch anime from Jikan API (MyAnimeList API)
  useEffect(() => {
    // Use fake data for testing - comment this line and uncomment fetchAnime() to use real API
    setAnimeList(fakeAnimeData);
    setLoading(false);
    
    // Uncomment to use real API:
    // fetchAnime();
  }, []);

  const fetchAnime = async () => {
    try {
      setLoading(true);
      // Fetching popular anime - you can change this endpoint
      const response = await fetch('https://api.jikan.moe.com/v4/top/anime?limit=25');
      const data = await response.json();
      setAnimeList(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching anime:', error);
      setLoading(false);
    }
  };

  const currentAnime = animeList[currentIndex];

  const handleSwipe = (direction) => {
    if (!currentAnime) return;
    
    setSwipeDirection(direction);
    
    if (direction === 'right') {
      setLikedAnime([...likedAnime, currentAnime]);
    } else {
      setDislikedAnime([...dislikedAnime, currentAnime]);
    }

    setTimeout(() => {
      setCurrentIndex(currentIndex + 1);
      setSwipeDirection(null);
    }, 300);
  };

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleSwipe('left');
    } else if (isRightSwipe) {
      handleSwipe('right');
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setLikedAnime(likedAnime.slice(0, -1));
      setDislikedAnime(dislikedAnime.slice(0, -1));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading anime...</div>
      </div>
    );
  }

  if (currentIndex >= animeList.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 flex flex-col items-center justify-center p-6">
        <div className="text-white text-center">
          <h2 className="text-3xl font-bold mb-4">That's all for now!</h2>
          <p className="text-lg mb-6">You've reviewed {animeList.length} anime shows</p>
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
            <p className="text-2xl mb-2">❤️ Liked: {likedAnime.length}</p>
            <p className="text-2xl">👎 Passed: {dislikedAnime.length}</p>
          </div>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setLikedAnime([]);
              setDislikedAnime([]);
            }}
            className="bg-white text-purple-900 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">AnimeSwipe</h1>
        <div className="text-white text-sm bg-white/20 px-3 py-1 rounded-full">
          {currentIndex + 1} / {animeList.length}
        </div>
      </div>

      {/* Card Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div 
          className={`relative w-full max-w-sm transition-transform duration-300 ${
            swipeDirection === 'right' ? 'translate-x-full opacity-0' : 
            swipeDirection === 'left' ? '-translate-x-full opacity-0' : ''
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="relative h-96">
              <img
                src={currentAnime.images.jpg.large_image_url}
                alt={currentAnime.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">{currentAnime.title}</h2>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                    ⭐ {currentAnime.score || 'N/A'}
                  </span>
                  <span className="bg-purple-500 px-2 py-1 rounded text-xs">
                    {currentAnime.type}
                  </span>
                  <span className="bg-blue-500 px-2 py-1 rounded text-xs">
                    {currentAnime.episodes || '?'} eps
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6 max-h-40 overflow-y-auto">
              <p className="text-gray-700 text-sm line-clamp-4">
                {currentAnime.synopsis}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 flex justify-center items-center gap-6">
        <button
          onClick={() => handleSwipe('left')}
          className="bg-white rounded-full p-5 shadow-lg hover:scale-110 transition-transform"
        >
          <X className="w-8 h-8 text-red-500" />
        </button>
        
        <button
          onClick={handleUndo}
          disabled={currentIndex === 0}
          className="bg-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-6 h-6 text-yellow-500" />
        </button>
        
        <button
          onClick={() => handleSwipe('right')}
          className="bg-white rounded-full p-5 shadow-lg hover:scale-110 transition-transform"
        >
          <Heart className="w-8 h-8 text-green-500" />
        </button>
      </div>

      {/* Stats Footer */}
      <div className="p-4 text-white text-center text-sm">
        <p>Swipe right to see more • Swipe left to pass</p>
      </div>
    </div>
  );
}