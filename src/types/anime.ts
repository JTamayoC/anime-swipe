/**
 * Anime Types for Supabase Database
 * Matching the database schema from supabase/schema.sql
 */

export type AnimeType = 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | 'Music';
export type AnimeStatus = 'Airing' | 'Finished' | 'Not yet aired';
export type AnimeSeason = 'Winter' | 'Spring' | 'Summer' | 'Fall';

export interface Anime {
  id: string;
  mal_id: number | null;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  synopsis: string | null;
  type: AnimeType;
  status: AnimeStatus;
  episodes: number | null;
  duration: number | null;
  aired_from: string | null;
  aired_to: string | null;
  season: AnimeSeason | null;
  year: number | null;
  score: number | null;
  scored_by: number;
  rank: number | null;
  popularity: number | null;
  rating: string | null;
  source: string | null;
  studios: string[] | null;
  producers: string[] | null;
  trailer: string | null;
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
