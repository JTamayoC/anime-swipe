'use client';

import { Heart, X, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';

import { type Anime } from '@/types/anime';
import { fakeAnimeData } from '@/utils/constants';

export default function AnimeSwipeApp() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [likedAnime, setLikedAnime] = useState<Anime[]>([]);
  const [dislikedAnime, setDislikedAnime] = useState<Anime[]>([]);

  // Fetch anime from Jikan API (MyAnimeList API)
  useEffect(() => {
    // Use fake data for testing - comment this line and uncomment fetchAnime() to use real API
    setAnimeList(fakeAnimeData);
    setLoading(false);

    // Uncomment to use real API:
    // fetchAnime();
  }, []);

  /*const fetchAnime = async () => {
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
  };*/

  const currentAnime = animeList[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 flex items-center justify-center p-6">
        <div className="text-white text-xl">Loading anime...</div>
      </div>
    );
  }

  if (currentIndex >= animeList.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 flex flex-col items-center justify-center p-8">
        <div className="text-white text-center">
          <h2 className="text-3xl font-bold mb-6">That&apos;s all for now!</h2>
          <p className="text-lg mb-8">You&apos;ve reviewed {animeList.length} anime shows</p>
          <div className="bg-white/10 backdrop-blur rounded-lg p-8 mb-8">
            <p className="text-2xl mb-3">❤️ Liked: {likedAnime.length}</p>
            <p className="text-2xl">👎 Passed: {dislikedAnime.length}</p>
          </div>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setLikedAnime([]);
              setDislikedAnime([]);
            }}
            className="bg-white text-purple-900 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition active:scale-95"
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
      <div className="p-6 flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">AnimeSwipe</h1>
        <div className="text-white text-sm bg-white/20 px-4 py-2 rounded-full">
          {currentIndex + 1} / {animeList.length}
        </div>
      </div>

      {/* Card Container */}
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div
          className={`relative w-full max-w-sm transition-transform duration-300 ${
            swipeDirection === 'right'
              ? 'translate-x-full opacity-0'
              : swipeDirection === 'left'
                ? '-translate-x-full opacity-0'
                : ''
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="relative h-96 w-full">
              <Image
                src={currentAnime.images.jpg.large_image_url}
                alt={currentAnime.title}
                fill
                className="object-cover z-0"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
                <h2 className="text-2xl font-bold mb-3">{currentAnime.title}</h2>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <span className="bg-yellow-500 text-black px-3 py-1.5 rounded text-xs font-bold">
                    ⭐ {currentAnime.score || 'N/A'}
                  </span>
                  <span className="bg-purple-500 px-3 py-1.5 rounded text-xs">
                    {currentAnime.type}
                  </span>
                  <span className="bg-blue-500 px-3 py-1.5 rounded text-xs">
                    {currentAnime.episodes || '?'} eps
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 max-h-40 overflow-y-auto px-4 py-4">
              <p className="text-gray-700 text-sm line-clamp-4 leading-relaxed">
                {currentAnime.synopsis}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 pb-8 flex justify-center items-center gap-6">
        <button
          onClick={() => handleSwipe('left')}
          className="bg-white rounded-full p-5 shadow-lg hover:scale-110 transition-transform active:scale-95"
        >
          <X className="w-8 h-8 text-red-500" />
        </button>

        <button
          onClick={handleUndo}
          disabled={currentIndex === 0}
          className="bg-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          <RotateCcw className="w-6 h-6 text-yellow-500" />
        </button>

        <button
          onClick={() => handleSwipe('right')}
          className="bg-white rounded-full p-5 shadow-lg hover:scale-110 transition-transform active:scale-95"
        >
          <Heart className="w-8 h-8 text-green-500" />
        </button>
      </div>

      {/* Stats Footer */}
      <div className="px-4 pb-6 text-white text-center text-sm">
        <p>Swipe right to see more • Swipe left to pass</p>
      </div>
    </div>
  );
}
