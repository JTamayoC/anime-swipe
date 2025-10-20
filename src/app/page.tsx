'use client';

import { Heart, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import type { RecommendationAnime } from '@/types/anime';
import { DEFAULT_PLACEHOLDER_IMAGE } from '@/utils/constants';
import { createClient } from '@/utils/supabase/client';

export default function AnimeSwipeApp() {
  const [animeList, setAnimeList] = useState<RecommendationAnime[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [swipeDirection, setSwipeDirection] = useState<
    'left' | 'right' | 'watched-liked' | 'watched-disliked' | null
  >(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const [likedAnime, setLikedAnime] = useState<RecommendationAnime[]>([]);
  const [dislikedAnime, setDislikedAnime] = useState<RecommendationAnime[]>([]);
  const [swipedAnimeIds, setSwipedAnimeIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const loadRecommendedAnime = async () => {
    try {
      const response = await fetch('/api/recommendations');
      if (response.ok) {
        const data = await response.json();
        // Parse covers from JSONB to array
        const parsedData = data.map(
          (anime: Record<string, unknown>) =>
            ({
              ...anime,
              covers: Array.isArray(anime.covers) ? anime.covers : [],
            }) as RecommendationAnime
        );
        setAnimeList(parsedData);
        // Reset swiped set since API now excludes already interacted anime
        setSwipedAnimeIds(new Set());
        setError(null);
      } else {
        setError('Failed to load recommendations. Please try again.');
      }
    } catch (_err) {
      setError('Network error. Please check your connection.');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/login');
      }

      // Load recommended anime (will use random if no prefs)
      await loadRecommendedAnime();
      setLoading(false);
    };
    void checkAuth();
  }, [router]);

  const getCurrentDisplayAnime = () => {
    for (let i = currentIndex; i < animeList.length; i++) {
      if (!swipedAnimeIds.has(animeList[i].id)) {
        return { anime: animeList[i], actualIndex: i };
      }
    }
    return null; // No more anime available
  };

  const currentDisplay = getCurrentDisplayAnime();
  const currentAnime = currentDisplay?.anime;
  const primaryCover = currentAnime?.covers?.find((c) => c.is_primary) ?? currentAnime?.covers?.[0];

  const handleSwipe = async (
    direction: 'left' | 'right' | 'watched-liked' | 'watched-disliked'
  ) => {
    if (!currentAnime) return;

    setSwipeDirection(direction);

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Save to user_lists based on action using new architecture
    let status: string = 'Plan to Watch';
    let preference: string | null = null;

    if (direction === 'left') {
      // Not interested - Not Interested status
      status = 'Not Interested';
      preference = null;
    } else if (direction === 'right') {
      // Interested - Plan to Watch
      status = 'Plan to Watch';
      preference = null;
    } else if (direction === 'watched-liked') {
      // Watched and liked - Completed + Liked
      status = 'Completed';
      preference = 'Liked';
    } else if (direction === 'watched-disliked') {
      // Watched but disliked - Completed + Disliked
      status = 'Completed';
      preference = 'Disliked';
    }

    const { error: swipeError } = await supabase.from('user_lists').upsert(
      {
        user_id: user.user.id,
        anime_id: currentAnime.id,
        status,
        preference,
        completed_at: status === 'Completed' ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,anime_id' }
    );

    if (swipeError) {
      console.error('Error saving interaction:', swipeError);
    }

    // Add to swiped set
    setSwipedAnimeIds((prev) => new Set(prev).add(currentAnime.id));

    // Update genre preferences based on preference
    if (preference === 'Liked') {
      setLikedAnime([...likedAnime, currentAnime]);
      void updateGenreWeightsFromSwipe(currentAnime.id, 0.01); // smaller delta
    } else if (preference === 'Disliked') {
      setDislikedAnime([...dislikedAnime, currentAnime]);
      void updateGenreWeightsFromSwipe(currentAnime.id, -0.005); // smaller negative delta
    }

    // Move to next anime
    setTimeout(() => {
      setCurrentIndex(currentDisplay.actualIndex + 1);
      setSwipeDirection(null);
    }, 300);
  };

  const updateGenreWeightsFromSwipe = async (animeId: string, delta: number = 0.05) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Call the database function to update genre weights
      const { error } = await supabase.rpc('update_genre_weights_from_action', {
        p_user_id: user.user.id,
        p_anime_id: animeId,
        p_delta: delta, // Use the passed delta parameter
      });

      if (error) {
        console.error('Error updating genre weights:', error);
        return;
      }

      // Fetch current genre preferences
      const { data: preferences, error: fetchError } = await supabase
        .from('user_genre_preferences')
        .select('genre_id, weight')
        .eq('user_id', user.user.id);

      if (fetchError) {
        console.error('Error fetching genre preferences:', fetchError);
        return;
      }

      // No need for additional normalization - the database function already handles it
      // Just update local state if needed
      if (preferences && preferences.length > 0) {
        // Optional: Update any local state that depends on weights
        // For now, we can skip this since the database function handles normalization
      }
    } catch (error) {
      console.error('Failed to update genre weights:', error);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchEndY(null);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !touchStartY || !touchEndY) return;

    const distanceX = touchStart - touchEnd;
    const distanceY = touchStartY - touchEndY;
    const isLeftSwipe = distanceX > 50;
    const isRightSwipe = distanceX < -50;
    const isUpSwipe = distanceY > 50;
    const isDownSwipe = distanceY < -50;

    // Prioritize horizontal swipes over vertical
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe) {
        void handleSwipe('left');
      } else if (isRightSwipe) {
        void handleSwipe('right');
      }
    } else {
      if (isUpSwipe) {
        void handleSwipe('watched-liked');
      } else if (isDownSwipe) {
        void handleSwipe('watched-disliked');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 flex items-center justify-center p-6">
        <div className="text-white text-xl">Loading anime...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 flex flex-col items-center justify-center p-8">
        <div className="text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Oops!</h2>
          <p className="text-lg mb-8">{error}</p>
          <button
            onClick={() => void loadRecommendedAnime()}
            className="bg-white text-purple-900 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (currentIndex >= animeList.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 flex flex-col items-center justify-center p-8">
        <div className="text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Loading more anime...</h2>
          <p className="text-lg mb-8">Getting fresh recommendations based on your preferences</p>
          <button
            onClick={() =>
              void (async () => {
                setCurrentIndex(0);
                setLikedAnime([]);
                setDislikedAnime([]);
                await loadRecommendedAnime();
              })()
            }
            className="bg-white text-purple-900 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition active:scale-95"
          >
            Load More Anime
          </button>
        </div>
      </div>
    );
  }

  if (!currentAnime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 flex flex-col items-center justify-center p-8">
        <div className="text-white text-center">
          <h2 className="text-3xl font-bold mb-6">No Anime Available</h2>
          <p className="text-lg mb-8">Unable to load anime recommendations. Please try again.</p>
          <button
            onClick={() => void loadRecommendedAnime()}
            className="bg-white text-purple-900 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition active:scale-95"
          >
            Try Again
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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/preferences')}
            className="text-white text-sm bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition"
          >
            Preferencias
          </button>
          <div className="text-white text-sm bg-white/20 px-4 py-2 rounded-full">
            {currentDisplay ? currentDisplay.actualIndex + 1 : currentIndex + 1} /{' '}
            {animeList.length}
          </div>
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
                : swipeDirection === 'watched-liked' || swipeDirection === 'watched-disliked'
                  ? 'translate-y-full opacity-0'
                  : ''
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="relative h-96 w-full">
              <Image
                src={primaryCover?.url ?? DEFAULT_PLACEHOLDER_IMAGE}
                alt={currentAnime.title_english ?? currentAnime.title}
                fill
                className="object-cover z-0"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
                <h2 className="text-2xl font-bold mb-2">
                  {currentAnime.title_english ?? currentAnime.title}
                </h2>
                {currentAnime.title_japanese &&
                  currentAnime.title_japanese !== currentAnime.title_english && (
                    <h3 className="text-lg font-medium mb-3 text-white/90">
                      {currentAnime.title_japanese}
                    </h3>
                  )}
                <div className="flex gap-2 mb-2 flex-wrap">
                  <span className="bg-yellow-500 text-black px-3 py-1.5 rounded text-xs font-bold">
                    ⭐ {currentAnime.score ?? 'N/A'}
                  </span>
                  <span className="bg-purple-500 px-3 py-1.5 rounded text-xs">
                    {currentAnime.type}
                  </span>
                  <span className="bg-blue-500 px-3 py-1.5 rounded text-xs">
                    {currentAnime.episodes ?? '?'} eps
                  </span>
                  {currentAnime.year && (
                    <span className="bg-green-500 px-3 py-1.5 rounded text-xs">
                      {currentAnime.year}
                    </span>
                  )}
                  <span className="bg-red-500 px-3 py-1.5 rounded text-xs">
                    {currentAnime.status}
                  </span>
                </div>
                {currentAnime.anime_genres && currentAnime.anime_genres.length > 0 && (
                  <div className="flex gap-1 mb-2 flex-wrap">
                    {currentAnime.anime_genres.slice(0, 3).map((ag) => (
                      <span key={ag.genres.id} className="bg-white/20 px-2 py-1 rounded text-xs">
                        {ag.genres.name}
                      </span>
                    ))}
                    {currentAnime.anime_genres.length > 3 && (
                      <span className="bg-white/20 px-2 py-1 rounded text-xs">
                        +{currentAnime.anime_genres.length - 3} más
                      </span>
                    )}
                  </div>
                )}
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
      <div className="p-6 pb-8 flex justify-center items-center gap-4">
        <button
          onClick={() => void handleSwipe('left')}
          className="bg-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform active:scale-95"
        >
          <X className="w-6 h-6 text-red-500" />
        </button>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => void handleSwipe('watched-liked')}
            className="bg-green-500 text-white rounded-full px-6 py-3 shadow-lg hover:scale-110 transition-transform active:scale-95 font-medium"
          >
            ✓ Watched & Liked
          </button>
          <button
            onClick={() => void handleSwipe('watched-disliked')}
            className="bg-orange-500 text-white rounded-full px-6 py-3 shadow-lg hover:scale-110 transition-transform active:scale-95 font-medium text-sm"
          >
            ✓ Watched & Disliked
          </button>
        </div>

        <button
          onClick={() => void handleSwipe('right')}
          className="bg-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform active:scale-95"
        >
          <Heart className="w-6 h-6 text-green-500" />
        </button>
      </div>

      {/* Stats Footer */}
      <div className="px-4 pb-6 text-white text-center text-sm">
        <p>
          Swipe left: Not Interested • Swipe right: Plan to Watch • Swipe up: Watched & Liked •
          Swipe down: Watched & Disliked
        </p>
      </div>
    </div>
  );
}
