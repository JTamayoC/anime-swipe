/**
 * Anime Types for Supabase Database
 * Matching the database schema from supabase/schema.sql
 */

export type AnimeType = 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | 'Music';
export type AnimeStatus = 'Airing' | 'Finished' | 'Not yet aired';
export type AnimeSeason = 'Winter' | 'Spring' | 'Summer' | 'Fall';
export type WatchStatus = 'Watching' | 'Completed' | 'On-Hold' | 'Dropped' | 'Plan to Watch';
export type PreferenceStatus = 'Interested' | 'Not Interested' | 'Liked' | 'Disliked';

export interface Anime {
  id: string;
  mal_id: number | null;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  title_synonyms: string[] | null; // Alternative titles
  synopsis: string | null;
  background: string | null; // Additional anime information
  type: AnimeType;
  status: AnimeStatus;
  episodes: number | null;
  duration: number | null; // duration in minutes
  aired_from: string | null; // DATE format
  aired_to: string | null; // DATE format
  season: AnimeSeason | null;
  year: number | null;
  score: number | null; // NUMERIC(3,2)
  scored_by: number;
  rank: number | null;
  popularity: number | null;
  members: number | null; // MAL members count
  favorites: number; // Favorites count (DEFAULT 0, so never null)
  rating: string | null;
  source: string | null;
  studios: string[] | null; // JSONB in database
  producers: string[] | null; // JSONB in database
  licensors: string[] | null; // JSONB in database
  streaming:
    | {
        name: string;
        url: string;
      }[]
    | null; // JSONB in database
  broadcast: {
    day: string | null;
    time: string | null;
    timezone: string | null;
    string: string | null;
  } | null;
  trailer: string | null; // YouTube URL
  mal_url: string | null; // MyAnimeList URL
  approved: boolean;
  airing: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnimeCover {
  id: string;
  anime_id: string;
  url: string;
  size: 'small' | 'medium' | 'large' | 'original';
  width: number | null;
  height: number | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnimeWithCovers extends Anime {
  covers?: AnimeCover[];
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  mal_id: number | null;
}

export interface AnimeWithGenres extends AnimeWithCovers {
  genres?: Genre[];
}

export interface UserList {
  id: string;
  user_id: string;
  anime_id: string;
  status: WatchStatus;
  preference: PreferenceStatus;
  is_favorite: boolean;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecommendationAnime {
  id: string;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  type: AnimeType;
  episodes: number | null;
  score: number | null;
  synopsis: string | null;
  year: number | null;
  status: AnimeStatus;
  covers?: AnimeCover[];
  anime_genres?: {
    id: string;
    anime_id: string;
    genre_id: string;
    genres: Genre;
  }[];
}
