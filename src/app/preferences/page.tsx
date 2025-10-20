'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';

import type { AnimeWithCovers } from '@/types/anime';
import { createClient } from '@/utils/supabase/client';

interface GenreWeight {
  genre_id: string;
  genre_name: string;
  weight: number;
}

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface AnimeWithDates extends AnimeWithCovers {
  started_at?: string;
  completed_at?: string;
  preference?: string;
}

export default function PreferencesPage() {
  const [likedAnime, setLikedAnime] = useState<AnimeWithCovers[]>([]);
  const [dislikedAnime, setDislikedAnime] = useState<AnimeWithCovers[]>([]);
  const [watchedAnime, setWatchedAnime] = useState<AnimeWithDates[]>([]);
  const [genreWeights, setGenreWeights] = useState<GenreWeight[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Anime search states
  const [animeSearch, setAnimeSearch] = useState('');
  const [searchResults, setSearchResults] = useState<AnimeWithCovers[]>([]);
  const [searching, setSearching] = useState(false);

  // Genre search states
  const [genreSearch, setGenreSearch] = useState('');
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [filteredGenres, setFilteredGenres] = useState<Genre[]>([]);
  const [genreWeightsTemp, setGenreWeightsTemp] = useState<{ [key: string]: number }>({});

  // Change tracking states
  const [genreChanges, setGenreChanges] = useState<{ [key: string]: number }>({});
  const [dateChanges, setDateChanges] = useState<{
    [key: string]: { started_at: string; completed_at: string };
  }>({});
  const [isCalculatingWeights, setIsCalculatingWeights] = useState(false);

  // Menu state
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Collapsible section states
  const [genresExpanded, setGenresExpanded] = useState(false);
  const [animePreferencesExpanded, setAnimePreferencesExpanded] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadPreferences = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        router.push('/login');
        return;
      }

      // Load liked anime (Por Ver)
      const { data: liked } = await supabase
        .from('user_lists')
        .select(
          `
          status,
          preference,
          anime:anime_id (
            *,
            covers (*)
          )
        `
        )
        .eq('user_id', user.user.id)
        .eq('status', 'Plan to Watch');

      // Load disliked anime (No me interesa)
      const { data: disliked } = await supabase
        .from('user_lists')
        .select(
          `
          status,
          preference,
          anime:anime_id (
            *,
            covers (*)
          )
        `
        )
        .eq('user_id', user.user.id)
        .eq('status', 'Not Interested');

      // Load watched anime (Completed + Liked OR Completed + Disliked)
      const { data: watched } = await supabase
        .from('user_lists')
        .select(
          `
          status,
          preference,
          anime:anime_id (
            *,
            covers (*)
          ),
          started_at,
          completed_at
        `
        )
        .eq('user_id', user.user.id)
        .eq('status', 'Completed');

      // Load genre preferences
      const { data: prefs } = await supabase
        .from('user_genre_preferences')
        .select(
          `
          genre_id,
          weight,
          genres!inner (
            name
          )
        `
        )
        .eq('user_id', user.user.id);

      if (liked) {
        // @ts-ignore - Supabase query result typing
        setLikedAnime(liked.map((item) => item.anime).filter(Boolean));
      }
      if (disliked) {
        // @ts-ignore - Supabase query result typing
        setDislikedAnime(disliked.map((item) => item.anime).filter(Boolean));
      }
      if (watched) {
        // @ts-ignore - Supabase query result typing
        setWatchedAnime(
          watched
            .map((item) => ({
              ...item.anime,
              started_at: item.started_at,
              completed_at: item.completed_at,
              preference: item.preference,
            }))
            .filter(Boolean) as unknown as AnimeWithDates[]
        );
      }
      if (prefs) {
        setGenreWeights(
          // @ts-ignore - Supabase query result typing
          prefs.map((pref) => ({
            genre_id: pref.genre_id,
            // @ts-ignore - Supabase genres relation typing
            genre_name: pref.genres?.name ?? 'Unknown',
            weight: pref.weight,
          }))
        );
      }

      setLoading(false);
    };

    void loadPreferences();
  }, [router, supabase]);

  // Load available genres on component mount - only if user has anime
  useEffect(() => {
    const loadGenres = async () => {
      // Only load genres if user has anime in their lists
      const hasAnime = likedAnime.length > 0 || dislikedAnime.length > 0 || watchedAnime.length > 0;
      if (!hasAnime) {
        setAllGenres([]);
        setFilteredGenres([]);
        return;
      }

      const { data, error } = await supabase.from('genres').select('*');
      if (error) {
        console.error('Error loading genres:', error);
        return;
      }

      const existingGenreIds = new Set(genreWeights.map((g) => g.genre_id));
      const availableGenres = (data || []).filter((genre) => !existingGenreIds.has(genre.id));

      setAllGenres(availableGenres);
      setFilteredGenres(availableGenres);
    };

    if (!loading) {
      void loadGenres();
    }
  }, [
    genreWeights,
    supabase,
    likedAnime.length,
    dislikedAnime.length,
    watchedAnime.length,
    loading,
  ]);

  // Filter genres based on search
  useEffect(() => {
    if (genreSearch.trim() === '') {
      setFilteredGenres([]);
    } else {
      const filtered = allGenres.filter((genre) =>
        genre.name.toLowerCase().includes(genreSearch.toLowerCase())
      );
      setFilteredGenres(filtered);
    }
  }, [genreSearch, allGenres]);

  const updateGenreWeight = (genreId: string, newWeight: number) => {
    // Track changes locally
    setGenreChanges((prev) => ({ ...prev, [genreId]: newWeight }));
    // Update local state immediately for UI feedback
    setGenreWeights((prev) =>
      prev.map((g) => (g.genre_id === genreId ? { ...g, weight: newWeight } : g))
    );
  };

  const saveAllGenreChanges = async () => {
    if (Object.keys(genreChanges).length === 0) return;

    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Update all changed genre weights
    const updatePromises = Object.entries(genreChanges).map(([genreId, weight]) =>
      supabase
        .from('user_genre_preferences')
        .update({ weight })
        .eq('user_id', user.user.id)
        .eq('genre_id', genreId)
    );

    await Promise.all(updatePromises);
    setGenreChanges({});
    setSaving(false);
  };

  const removeAnimeFromList = async (animeId: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    await supabase.from('user_lists').delete().eq('user_id', user.user.id).eq('anime_id', animeId);

    // Remove from local state
    setLikedAnime((prev) => prev.filter((a) => a.id !== animeId));
    setDislikedAnime((prev) => prev.filter((a) => a.id !== animeId));
    setWatchedAnime((prev) => prev.filter((a) => a.id !== animeId));
  };

  const addGenrePreference = async (genreId: string, weight: number) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    setSaving(true);
    const { error } = await supabase
      .from('user_genre_preferences')
      .insert({ user_id: user.user.id, genre_id: genreId, weight });

    if (!error) {
      // Update local state
      const genre = allGenres.find((g) => g.id === genreId);
      if (genre) {
        setGenreWeights((prev) => [
          ...prev,
          {
            genre_id: genre.id,
            genre_name: genre.name,
            weight,
          },
        ]);
        // Remove from available genres
        setAllGenres((prev) => prev.filter((g) => g.id !== genreId));
        setFilteredGenres((prev) => prev.filter((g) => g.id !== genreId));
      }
    }
    setSaving(false);
  };

  const removeGenrePreference = async (genreId: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    setSaving(true);
    const { error } = await supabase
      .from('user_genre_preferences')
      .delete()
      .eq('user_id', user.user.id)
      .eq('genre_id', genreId);

    if (!error) {
      // Update local state
      setGenreWeights((prev) => prev.filter((g) => g.genre_id !== genreId));
      // Add back to available genres
      const genre = allGenres.find((g) => g.id === genreId);
      if (genre) {
        setAllGenres((prev) => [...prev, genre]);
        setFilteredGenres((prev) => [...prev, genre]);
      }
      // Remove from changes if it was being tracked
      setGenreChanges((prev) => {
        const newChanges = { ...prev };
        delete newChanges[genreId];
        return newChanges;
      });
    }
    setSaving(false);
  };

  const updateAnimeDates = (animeId: string, startedAt: string, completedAt: string) => {
    // Track changes locally
    setDateChanges((prev) => ({
      ...prev,
      [animeId]: { started_at: startedAt, completed_at: completedAt },
    }));

    // Update local state immediately for UI feedback
    setWatchedAnime((prev) =>
      prev.map((anime) =>
        anime.id === animeId
          ? { ...anime, started_at: startedAt, completed_at: completedAt }
          : anime
      )
    );
  };

  const saveAllDateChanges = async () => {
    if (Object.keys(dateChanges).length === 0) return;

    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Update all changed anime dates
    const updatePromises = Object.entries(dateChanges).map(([animeId, dates]) =>
      supabase
        .from('user_lists')
        .update({
          started_at: dates.started_at || null,
          completed_at: dates.completed_at || null,
        })
        .eq('user_id', user.user.id)
        .eq('anime_id', animeId)
    );

    await Promise.all(updatePromises);
    setDateChanges({});
    setSaving(false);
  };

  const calculateGenreWeights = useCallback(async () => {
    if (isCalculatingWeights) {
      console.warn('Genre weight calculation already in progress, skipping...');
      return;
    }

    setIsCalculatingWeights(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setIsCalculatingWeights(false);
        return;
      }

      // Get all anime with their genres
      const allAnime = [...likedAnime, ...dislikedAnime, ...watchedAnime];
      if (allAnime.length === 0) {
        setIsCalculatingWeights(false);
        return;
      }

      // Collect genre statistics
      const genreStats: Record<
        string,
        { name: string; liked: number; disliked: number; total: number }
      > = {};

      for (const anime of allAnime) {
        // Get genres from database since AnimeWithCovers doesn't include them
        const { data: animeGenres } = await supabase
          .from('anime_genres')
          .select(
            `
            genre_id,
            genres (
              name
            )
          `
          )
          .eq('anime_id', anime.id);

        if (animeGenres) {
          for (const ag of animeGenres) {
            const genreId = ag.genre_id;
            const genreName = ag.genres?.[0]?.name ?? 'Unknown';

            if (!genreStats[genreId]) {
              genreStats[genreId] = { name: genreName, liked: 0, disliked: 0, total: 0 };
            }
            genreStats[genreId].total++;

            // Determine if liked or disliked based on list and preference
            const isLiked =
              likedAnime.some((a) => a.id === anime.id) ||
              watchedAnime.some((a) => a.id === anime.id && a.preference === 'Liked');
            const isDisliked =
              dislikedAnime.some((a) => a.id === anime.id) ||
              watchedAnime.some((a) => a.id === anime.id && a.preference === 'Disliked');

            if (isLiked) {
              genreStats[genreId].liked++;
            } else if (isDisliked) {
              genreStats[genreId].disliked++;
            }
          }
        }
      }

      // Calculate new weights
      const newWeights: Record<string, number> = {};
      for (const [genreId, stats] of Object.entries(genreStats)) {
        if (stats.total > 0) {
          const likeRatio = stats.liked / stats.total;
          const dislikeRatio = stats.disliked / stats.total;
          // Weight calculation: base 0.5, adjust by like/dislike ratios
          newWeights[genreId] = Math.max(
            0.1,
            Math.min(1.0, 0.5 + (likeRatio - dislikeRatio) * 0.5)
          );
        }
      }

      // Update database with new weights (sequentially to reduce server load)
      for (const [genreId, weight] of Object.entries(newWeights)) {
        const { error } = await supabase.from('user_genre_preferences').upsert(
          {
            user_id: user.user.id,
            genre_id: genreId,
            weight: weight,
          },
          { onConflict: 'user_id,genre_id' }
        );

        if (error) {
          console.error(`Error updating weight for genre ${genreId}:`, error);
        }
      }

      // Update local state - only update weights for existing genres, don't replace the entire list
      setGenreWeights((prev) =>
        prev.map((genre) => {
          const newWeight = newWeights[genre.genre_id];
          if (newWeight !== undefined) {
            return { ...genre, weight: newWeight };
          }
          return genre;
        })
      );
    } catch (error) {
      console.error('Error calculating genre weights:', error);
    } finally {
      setIsCalculatingWeights(false);
    }
  }, [supabase, isCalculatingWeights, likedAnime, dislikedAnime, watchedAnime]);

  // Removed automatic recalculation to prevent infinite loops
  // Genre weights are now only calculated when explicitly requested
  const changeAnimeStatus = async (
    animeId: string,
    newStatus: 'interested' | 'not-interested' | 'watched-liked' | 'watched-disliked' | 'remove'
  ) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    if (newStatus === 'remove') {
      await removeAnimeFromList(animeId);
      // Removed automatic weight recalculation to prevent loops
      return;
    }

    let status: string;
    let preference: string | null = null;

    if (newStatus === 'interested') {
      status = 'Plan to Watch';
      preference = null;
    } else if (newStatus === 'not-interested') {
      status = 'Not Interested';
      preference = null;
    } else if (newStatus === 'watched-liked') {
      status = 'Completed';
      preference = 'Liked';
    } else if (newStatus === 'watched-disliked') {
      status = 'Completed';
      preference = 'Disliked';
    } else {
      // Default to Por Ver
      status = 'Plan to Watch';
      preference = null;
    }

    // Since we're changing status of an existing anime, use update instead of upsert
    const { error } = await supabase
      .from('user_lists')
      .update({
        status,
        preference,
        completed_at: status === 'Completed' ? new Date().toISOString() : null,
      })
      .eq('user_id', user.user.id)
      .eq('anime_id', animeId);

    if (error) {
      console.error('Error updating anime status:', error);
      return;
    }

    // Remove from all current lists
    setLikedAnime((prev) => prev.filter((a) => a.id !== animeId));
    setDislikedAnime((prev) => prev.filter((a) => a.id !== animeId));
    setWatchedAnime((prev) => prev.filter((a) => a.id !== animeId));

    // Add to new list
    const currentAnime = [...likedAnime, ...dislikedAnime, ...watchedAnime].find(
      (a) => a.id === animeId
    );
    if (currentAnime) {
      if (newStatus === 'interested') {
        setLikedAnime((prev) => [...prev, currentAnime]);
      } else if (newStatus === 'not-interested') {
        setDislikedAnime((prev) => [...prev, currentAnime]);
      } else if (newStatus === 'watched-liked' || newStatus === 'watched-disliked') {
        setWatchedAnime((prev) => [
          ...prev,
          { ...currentAnime, completed_at: new Date().toISOString() },
        ]);
      }
    }

    setOpenMenu(null);

    // Removed automatic weight recalculation to prevent loops
    // Users can manually recalculate weights when needed
  };

  const getCurrentAnimeStatus = (animeId: string) => {
    if (likedAnime.some((a) => a.id === animeId)) return 'interested';
    if (dislikedAnime.some((a) => a.id === animeId)) return 'not-interested';
    const watched = watchedAnime.find((a) => a.id === animeId);
    if (watched) {
      return watched.preference === 'Liked'
        ? 'watched-liked'
        : watched.preference === 'Disliked'
          ? 'watched-disliked'
          : 'watched';
    }
    return null;
  };

  const searchAnime = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data, error } = await supabase
      .from('anime')
      .select('*, covers(*)')
      .or(`title.ilike.%${query}%,title_english.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Error searching anime:', error);
    } else {
      setSearchResults(data || []);
    }
    setSearching(false);
  };

  const addAnimeToCategory = async (
    anime: AnimeWithCovers,
    category: 'watched-liked' | 'watched-disliked' | 'liked' | 'disliked'
  ) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    let status: string;
    let preference: string | null = null;

    if (category === 'watched-liked') {
      status = 'Completed';
      preference = 'Liked';
    } else if (category === 'watched-disliked') {
      status = 'Completed';
      preference = 'Disliked';
    } else if (category === 'liked') {
      status = 'Plan to Watch';
      preference = null;
    } else if (category === 'disliked') {
      status = 'Not Interested';
      preference = null;
    } else {
      // Default
      status = 'Plan to Watch';
      preference = null;
    }

    const { error } = await supabase.from('user_lists').upsert(
      {
        user_id: user.user.id,
        anime_id: anime.id,
        status,
        preference,
        completed_at: status === 'Completed' ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,anime_id' }
    );

    if (error) {
      console.error('Error adding anime to category:', error);
      return;
    }

    // Update local state
    if (category === 'watched-liked' || category === 'watched-disliked') {
      setWatchedAnime((prev) => [...prev, anime]);
    } else if (category === 'liked') {
      setLikedAnime((prev) => [...prev, anime]);
    } else if (category === 'disliked') {
      setDislikedAnime((prev) => [...prev, anime]);
    }

    // Clear search
    setAnimeSearch('');
    setSearchResults([]);

    // Removed automatic weight recalculation to prevent loops
    // Users can manually recalculate weights when needed
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Preferencias</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-white text-purple-900 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition"
          >
            Volver al Swipe
          </button>
        </div>

        {/* Genre Preferences */}
        <div
          className={`bg-white/10 backdrop-blur rounded-lg p-6 mb-8 ${Object.keys(genreChanges).length > 0 ? 'ring-2 ring-yellow-400' : ''}`}
        >
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setGenresExpanded(!genresExpanded)}
              className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
            >
              <span
                className={`text-xl transition-transform duration-200 ${genresExpanded ? 'rotate-180' : ''}`}
              >
                ▾
              </span>
              <h2 className="text-2xl font-bold">Preferencias de Géneros</h2>
            </button>
          </div>

          {genresExpanded && (
            <>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => void calculateGenreWeights()}
                  disabled={isCalculatingWeights}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isCalculatingWeights ? 'Calculando...' : '🔄 Restablecer Pesos'}
                </button>
                {Object.keys(genreChanges).length > 0 && (
                  <button
                    onClick={() => void saveAllGenreChanges()}
                    disabled={saving}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {saving
                      ? 'Guardando...'
                      : `Guardar ${Object.keys(genreChanges).length} cambios`}
                  </button>
                )}
              </div>

              {/* Genre Search and Add */}
              <div className="mb-6">
                <h3 className="text-white text-lg font-semibold mb-3">Buscar y Agregar Géneros</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar géneros disponibles..."
                    value={genreSearch}
                    onChange={(e) => setGenreSearch(e.target.value)}
                    className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>

                {filteredGenres.length > 0 && (
                  <div className="mt-4 max-h-60 overflow-y-auto bg-white/10 rounded-lg p-2">
                    {filteredGenres.slice(0, 10).map((genre) => (
                      <div
                        key={genre.id}
                        className="flex items-center justify-between p-2 bg-white/20 rounded mb-2"
                      >
                        <span className="text-white font-medium">{genre.name}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={genreWeightsTemp[genre.id] ?? 0.5}
                            onChange={(e) => {
                              const weight = parseFloat(e.target.value);
                              setGenreWeightsTemp((prev) => ({ ...prev, [genre.id]: weight }));
                            }}
                            className="w-20"
                          />
                          <span className="text-white text-sm w-8">
                            {Math.round((genreWeightsTemp[genre.id] ?? 0.5) * 100)}%
                          </span>
                          <button
                            onClick={() => {
                              const weight = genreWeightsTemp[genre.id] ?? 0.5;
                              void addGenrePreference(genre.id, weight);
                            }}
                            disabled={saving}
                            className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                          >
                            {saving ? '...' : 'Agregar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {genreWeights.map((genre) => (
                  <div
                    key={genre.genre_id}
                    className={`bg-white/20 rounded-lg p-4 relative ${genreChanges[genre.genre_id] !== undefined ? 'ring-2 ring-yellow-300' : ''}`}
                  >
                    <button
                      onClick={() => void removeGenrePreference(genre.genre_id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs"
                      title="Quitar género"
                    >
                      ×
                    </button>
                    <h3 className="text-white font-semibold mb-2 pr-8">{genre.genre_name}</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={genre.weight}
                        onChange={(e) => {
                          const newWeight = parseFloat(e.target.value);
                          void updateGenreWeight(genre.genre_id, newWeight);
                        }}
                        className="flex-1"
                      />
                      <span className="text-white text-sm w-12">
                        {Math.round(genre.weight * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Anime Preferences */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-8">
          <button
            onClick={() => setAnimePreferencesExpanded(!animePreferencesExpanded)}
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors mb-4"
          >
            <span
              className={`text-xl transition-transform duration-200 ${animePreferencesExpanded ? 'rotate-180' : ''}`}
            >
              ▾
            </span>
            <h2 className="text-2xl font-bold">Preferencias de Anime</h2>
          </button>

          {animePreferencesExpanded && (
            <>
              {/* Anime Search and Add */}
              <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">Buscar y agregar Anime</h3>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar anime para agregar..."
                    value={animeSearch}
                    onChange={(e) => {
                      setAnimeSearch(e.target.value);
                      void searchAnime(e.target.value);
                    }}
                    className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  {searching && (
                    <div className="absolute right-3 top-3 text-white">Buscando...</div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-4 max-h-60 overflow-y-auto bg-white/10 rounded-lg p-2">
                    {searchResults.map((anime) => {
                      const status = getCurrentAnimeStatus(anime.id);
                      return (
                        <div
                          key={anime.id}
                          className="flex items-center justify-between p-2 bg-white/20 rounded mb-2"
                        >
                          <div className="flex items-center gap-3">
                            <Image
                              src={anime.covers?.[0]?.url ?? '/placeholder.jpg'}
                              alt={anime.title}
                              width={40}
                              height={60}
                              className="object-cover rounded"
                            />
                            <div>
                              <h4 className="text-white font-medium text-sm">
                                {anime.title_english ?? anime.title}
                              </h4>
                              <p className="text-white/70 text-xs">⭐ {anime.score ?? 'N/A'}</p>
                              {status && (
                                <p className="text-yellow-300 text-xs font-medium">
                                  {status === 'interested' && '✅ Ya está en Por Ver'}
                                  {status === 'not-interested' && '❌ Ya está en No me interesa'}
                                  {status === 'watched' && '👁️ Ya está en Vistos'}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => void addAnimeToCategory(anime, 'watched-liked')}
                              disabled={status === 'watched'}
                              className={`px-2 py-1 rounded text-xs ${
                                status === 'watched'
                                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              ✅ Vi y me gustó
                            </button>
                            <button
                              onClick={() => void addAnimeToCategory(anime, 'watched-disliked')}
                              disabled={status === 'watched'}
                              className={`px-2 py-1 rounded text-xs ${
                                status === 'watched'
                                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                  : 'bg-orange-600 text-white hover:bg-orange-700'
                              }`}
                            >
                              ❌ Vi y no me gustó
                            </button>
                            <button
                              onClick={() => void addAnimeToCategory(anime, 'liked')}
                              disabled={status === 'interested'}
                              className={`px-2 py-1 rounded text-xs ${
                                status === 'interested'
                                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              📋 Por Ver
                            </button>
                            <button
                              onClick={() => void addAnimeToCategory(anime, 'disliked')}
                              disabled={status === 'not-interested'}
                              className={`px-2 py-1 rounded text-xs ${
                                status === 'not-interested'
                                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                            >
                              👎 No me interesa
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Liked Anime (Por Ver) */}
              <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">Por Ver 📋 ({likedAnime.length})</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {likedAnime.map((anime) => (
                    <div key={anime.id} className="bg-white rounded-lg overflow-hidden shadow-lg">
                      <div className="relative h-48">
                        <Image
                          src={anime.covers?.[0]?.url ?? '/placeholder.jpg'}
                          alt={anime.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute top-2 right-2">
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenu(
                                  openMenu === `liked-${anime.id}` ? null : `liked-${anime.id}`
                                )
                              }
                              className="bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-600 text-lg"
                              title="Opciones"
                            >
                              ⋮
                            </button>
                            {openMenu === `liked-${anime.id}` && (
                              <div className="absolute top-10 right-0 bg-white rounded-lg shadow-lg py-2 min-w-48 z-10">
                                <div className="px-4 py-1 text-xs font-semibold text-gray-600 border-b">
                                  Cambiar a:
                                </div>
                                <button
                                  onClick={() => void changeAnimeStatus(anime.id, 'watched-liked')}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                  👍 Visto y me gustó
                                </button>
                                <button
                                  onClick={() =>
                                    void changeAnimeStatus(anime.id, 'watched-disliked')
                                  }
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                  👎 Visto y no me gustó
                                </button>
                                <button
                                  onClick={() => void changeAnimeStatus(anime.id, 'not-interested')}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                  🚫 No me interesa
                                </button>
                                <button
                                  onClick={() => void changeAnimeStatus(anime.id, 'remove')}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                >
                                  🗑️ Quitar de la lista
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h5 className="font-bold text-sm line-clamp-2">
                          {anime.title_english ?? anime.title}
                        </h5>
                        <p className="text-gray-600 text-xs mt-1">⭐ {anime.score ?? 'N/A'}</p>
                        {anime.streaming && anime.streaming.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {anime.streaming.slice(0, 2).map((stream) => (
                              <a
                                key={stream.name}
                                href={stream.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-200 transition"
                                title={`Ver en ${stream.name}`}
                              >
                                📺 {stream.name}
                              </a>
                            ))}
                            {anime.streaming.length > 2 && (
                              <span className="text-gray-500 text-xs px-2 py-1">
                                +{anime.streaming.length - 2} más
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Watched Anime */}
              <div
                className={`bg-white/10 backdrop-blur rounded-lg p-6 mb-6 ${Object.keys(dateChanges).length > 0 ? 'ring-2 ring-yellow-400' : ''}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Vistos ✅ ({watchedAnime.length})</h3>
                  {Object.keys(dateChanges).length > 0 && (
                    <button
                      onClick={() => void saveAllDateChanges()}
                      disabled={saving}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      {saving
                        ? 'Guardando...'
                        : `Guardar ${Object.keys(dateChanges).length} cambios`}
                    </button>
                  )}
                </div>

                {/* Liked Watched Anime */}
                {watchedAnime.filter((anime) => anime.preference === 'Liked').length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-green-300 text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="text-green-400">👍</span> Me gustaron (
                      {watchedAnime.filter((anime) => anime.preference === 'Liked').length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                      {watchedAnime
                        .filter((anime) => anime.preference === 'Liked')
                        .map((anime) => (
                          <div
                            key={anime.id}
                            className={`bg-white rounded-lg overflow-hidden shadow-lg ${dateChanges[anime.id] ? 'ring-2 ring-yellow-300' : ''}`}
                          >
                            <div className="relative h-48">
                              <Image
                                src={anime.covers?.[0]?.url ?? '/placeholder.jpg'}
                                alt={anime.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
                              {/* Preference badge */}
                              <div className="absolute top-2 left-2">
                                <span className="px-2 py-1 rounded-full text-xs font-bold text-white bg-green-600">
                                  👍 Me gustó
                                </span>
                              </div>
                              <div className="absolute top-2 right-2">
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      setOpenMenu(
                                        openMenu === `watched-${anime.id}`
                                          ? null
                                          : `watched-${anime.id}`
                                      )
                                    }
                                    className="bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-600 text-lg"
                                    title="Opciones"
                                  >
                                    ⋮
                                  </button>
                                  {openMenu === `watched-${anime.id}` && (
                                    <div className="absolute top-10 right-0 bg-white rounded-lg shadow-lg py-2 min-w-48 z-10">
                                      <div className="px-4 py-1 text-xs font-semibold text-gray-600 border-b">
                                        Cambiar a:
                                      </div>
                                      {getCurrentAnimeStatus(anime.id) !== 'interested' && (
                                        <button
                                          onClick={() =>
                                            void changeAnimeStatus(anime.id, 'interested')
                                          }
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          📋 Por Ver
                                        </button>
                                      )}
                                      {getCurrentAnimeStatus(anime.id) !== 'not-interested' && (
                                        <button
                                          onClick={() =>
                                            void changeAnimeStatus(anime.id, 'not-interested')
                                          }
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          🚫 No me interesa
                                        </button>
                                      )}
                                      {getCurrentAnimeStatus(anime.id) !== 'watched-liked' && (
                                        <button
                                          onClick={() =>
                                            void changeAnimeStatus(anime.id, 'watched-liked')
                                          }
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          👍 Visto y me gustó
                                        </button>
                                      )}
                                      {getCurrentAnimeStatus(anime.id) !== 'watched-disliked' && (
                                        <button
                                          onClick={() =>
                                            void changeAnimeStatus(anime.id, 'watched-disliked')
                                          }
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          👎 Visto y no me gustó
                                        </button>
                                      )}
                                      <button
                                        onClick={() => void changeAnimeStatus(anime.id, 'remove')}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                      >
                                        🗑️ Quitar de la lista
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              <h5 className="font-bold text-sm line-clamp-2">
                                {anime.title_english ?? anime.title}
                              </h5>
                              <p className="text-gray-600 text-xs mt-1">
                                ⭐ {anime.score ?? 'N/A'}
                              </p>
                              {anime.streaming && anime.streaming.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {anime.streaming.slice(0, 2).map((stream) => (
                                    <a
                                      key={stream.name}
                                      href={stream.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-200 transition"
                                      title={`Ver en ${stream.name}`}
                                    >
                                      📺 {stream.name}
                                    </a>
                                  ))}
                                  {anime.streaming.length > 2 && (
                                    <span className="text-gray-500 text-xs px-2 py-1">
                                      +{anime.streaming.length - 2} más
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Date inputs */}
                              <div className="mt-3 space-y-2">
                                <div>
                                  <label
                                    htmlFor={`started-${anime.id}`}
                                    className="text-gray-600 text-xs block"
                                  >
                                    Empezado:
                                  </label>
                                  <input
                                    id={`started-${anime.id}`}
                                    type="date"
                                    value={
                                      anime.started_at
                                        ? new Date(anime.started_at).toISOString().split('T')[0]
                                        : ''
                                    }
                                    onChange={(e) => {
                                      const startedAt = e.target.value;
                                      const completedAt = anime.completed_at
                                        ? new Date(anime.completed_at).toISOString().split('T')[0]
                                        : '';
                                      updateAnimeDates(anime.id, startedAt, completedAt);
                                    }}
                                    className="w-full text-xs p-1 border rounded"
                                  />
                                </div>
                                <div>
                                  <label
                                    htmlFor={`completed-${anime.id}`}
                                    className="text-gray-600 text-xs block"
                                  >
                                    Completado:
                                  </label>
                                  <input
                                    id={`completed-${anime.id}`}
                                    type="date"
                                    value={
                                      anime.completed_at
                                        ? new Date(anime.completed_at).toISOString().split('T')[0]
                                        : ''
                                    }
                                    onChange={(e) => {
                                      const completedAt = e.target.value;
                                      const startedAt = anime.started_at
                                        ? new Date(anime.started_at).toISOString().split('T')[0]
                                        : '';
                                      updateAnimeDates(anime.id, startedAt, completedAt);
                                    }}
                                    className="w-full text-xs p-1 border rounded"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Separator if both groups exist */}
                {watchedAnime.filter((anime) => anime.preference === 'Liked').length > 0 &&
                  watchedAnime.filter((anime) => anime.preference === 'Disliked').length > 0 && (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex-1 h-px bg-white/30"></div>
                      <span className="px-4 text-white/70 text-sm font-medium">• • •</span>
                      <div className="flex-1 h-px bg-white/30"></div>
                    </div>
                  )}

                {/* Disliked Watched Anime */}
                {watchedAnime.filter((anime) => anime.preference === 'Disliked').length > 0 && (
                  <div>
                    <h4 className="text-red-300 text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="text-red-400">👎</span> No me gustaron (
                      {watchedAnime.filter((anime) => anime.preference === 'Disliked').length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {watchedAnime
                        .filter((anime) => anime.preference === 'Disliked')
                        .map((anime) => (
                          <div
                            key={anime.id}
                            className={`bg-white rounded-lg overflow-hidden shadow-lg ${dateChanges[anime.id] ? 'ring-2 ring-yellow-300' : ''}`}
                          >
                            <div className="relative h-48">
                              <Image
                                src={anime.covers?.[0]?.url ?? '/placeholder.jpg'}
                                alt={anime.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
                              {/* Preference badge */}
                              <div className="absolute top-2 left-2">
                                <span className="px-2 py-1 rounded-full text-xs font-bold text-white bg-red-600">
                                  👎 No me gustó
                                </span>
                              </div>
                              <div className="absolute top-2 right-2">
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      setOpenMenu(
                                        openMenu === `watched-${anime.id}`
                                          ? null
                                          : `watched-${anime.id}`
                                      )
                                    }
                                    className="bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-600 text-lg"
                                    title="Opciones"
                                  >
                                    ⋮
                                  </button>
                                  {openMenu === `watched-${anime.id}` && (
                                    <div className="absolute top-10 right-0 bg-white rounded-lg shadow-lg py-2 min-w-48 z-10">
                                      <div className="px-4 py-1 text-xs font-semibold text-gray-600 border-b">
                                        Cambiar a:
                                      </div>
                                      {getCurrentAnimeStatus(anime.id) !== 'interested' && (
                                        <button
                                          onClick={() =>
                                            void changeAnimeStatus(anime.id, 'interested')
                                          }
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          📋 Por Ver
                                        </button>
                                      )}
                                      {getCurrentAnimeStatus(anime.id) !== 'not-interested' && (
                                        <button
                                          onClick={() =>
                                            void changeAnimeStatus(anime.id, 'not-interested')
                                          }
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          🚫 No me interesa
                                        </button>
                                      )}
                                      {getCurrentAnimeStatus(anime.id) !== 'watched-liked' && (
                                        <button
                                          onClick={() =>
                                            void changeAnimeStatus(anime.id, 'watched-liked')
                                          }
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          👍 Visto y me gustó
                                        </button>
                                      )}
                                      {getCurrentAnimeStatus(anime.id) !== 'watched-disliked' && (
                                        <button
                                          onClick={() =>
                                            void changeAnimeStatus(anime.id, 'watched-disliked')
                                          }
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          👎 Visto y no me gustó
                                        </button>
                                      )}
                                      <button
                                        onClick={() => void changeAnimeStatus(anime.id, 'remove')}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                      >
                                        🗑️ Quitar de la lista
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              <h5 className="font-bold text-sm line-clamp-2">
                                {anime.title_english ?? anime.title}
                              </h5>
                              <p className="text-gray-600 text-xs mt-1">
                                ⭐ {anime.score ?? 'N/A'}
                              </p>
                              {anime.streaming && anime.streaming.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {anime.streaming.slice(0, 2).map((stream) => (
                                    <a
                                      key={stream.name}
                                      href={stream.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-200 transition"
                                      title={`Ver en ${stream.name}`}
                                    >
                                      📺 {stream.name}
                                    </a>
                                  ))}
                                  {anime.streaming.length > 2 && (
                                    <span className="text-gray-500 text-xs px-2 py-1">
                                      +{anime.streaming.length - 2} más
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Date inputs */}
                              <div className="mt-3 space-y-2">
                                <div>
                                  <label
                                    htmlFor={`started-${anime.id}`}
                                    className="text-gray-600 text-xs block"
                                  >
                                    Empezado:
                                  </label>
                                  <input
                                    id={`started-${anime.id}`}
                                    type="date"
                                    value={
                                      anime.started_at
                                        ? new Date(anime.started_at).toISOString().split('T')[0]
                                        : ''
                                    }
                                    onChange={(e) => {
                                      const startedAt = e.target.value;
                                      const completedAt = anime.completed_at
                                        ? new Date(anime.completed_at).toISOString().split('T')[0]
                                        : '';
                                      updateAnimeDates(anime.id, startedAt, completedAt);
                                    }}
                                    className="w-full text-xs p-1 border rounded"
                                  />
                                </div>
                                <div>
                                  <label
                                    htmlFor={`completed-${anime.id}`}
                                    className="text-gray-600 text-xs block"
                                  >
                                    Completado:
                                  </label>
                                  <input
                                    id={`completed-${anime.id}`}
                                    type="date"
                                    value={
                                      anime.completed_at
                                        ? new Date(anime.completed_at).toISOString().split('T')[0]
                                        : ''
                                    }
                                    onChange={(e) => {
                                      const completedAt = e.target.value;
                                      const startedAt = anime.started_at
                                        ? new Date(anime.started_at).toISOString().split('T')[0]
                                        : '';
                                      updateAnimeDates(anime.id, startedAt, completedAt);
                                    }}
                                    className="w-full text-xs p-1 border rounded"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Show message if no watched anime */}
                {watchedAnime.length === 0 && (
                  <p className="text-white/70 text-center py-8">
                    No has visto ningún anime todavía.
                  </p>
                )}
              </div>

              {/* Disliked Anime */}
              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <h3 className="text-xl font-bold">No me interesa 🚫 ({dislikedAnime.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {dislikedAnime.map((anime) => (
                    <div key={anime.id} className="bg-white rounded-lg overflow-hidden shadow-lg">
                      <div className="relative h-48">
                        <Image
                          src={anime.covers?.[0]?.url ?? '/placeholder.jpg'}
                          alt={anime.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute top-2 right-2">
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenu(
                                  openMenu === `disliked-${anime.id}`
                                    ? null
                                    : `disliked-${anime.id}`
                                )
                              }
                              className="bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-600 text-lg"
                              title="Opciones"
                            >
                              ⋮
                            </button>
                            {openMenu === `disliked-${anime.id}` && (
                              <div className="absolute top-10 right-0 bg-white rounded-lg shadow-lg py-2 min-w-48 z-10">
                                <div className="px-4 py-1 text-xs font-semibold text-gray-600 border-b">
                                  Cambiar a:
                                </div>
                                <button
                                  onClick={() => void changeAnimeStatus(anime.id, 'watched-liked')}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                  👍 Visto y me gustó
                                </button>
                                <button
                                  onClick={() =>
                                    void changeAnimeStatus(anime.id, 'watched-disliked')
                                  }
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                  👎 Visto y no me gustó
                                </button>
                                <button
                                  onClick={() => void changeAnimeStatus(anime.id, 'interested')}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                  📋 Por Ver
                                </button>
                                <button
                                  onClick={() => void changeAnimeStatus(anime.id, 'remove')}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                >
                                  🗑️ Quitar de la lista
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h5 className="font-bold text-sm line-clamp-2">
                          {anime.title_english ?? anime.title}
                        </h5>
                        <p className="text-gray-600 text-xs mt-1">⭐ {anime.score ?? 'N/A'}</p>
                        {anime.streaming && anime.streaming.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {anime.streaming.slice(0, 2).map((stream) => (
                              <a
                                key={stream.name}
                                href={stream.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-200 transition"
                                title={`Ver en ${stream.name}`}
                              >
                                📺 {stream.name}
                              </a>
                            ))}
                            {anime.streaming.length > 2 && (
                              <span className="text-gray-500 text-xs px-2 py-1">
                                +{anime.streaming.length - 2} más
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
