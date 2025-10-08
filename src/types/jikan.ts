/**
 * Jikan API Types - Complete mapping of the Jikan v4 API response
 * This represents the raw data structure from https://api.jikan.moe/v4/
 */

export interface JikanImage {
  image_url: string;
  small_image_url: string;
  large_image_url: string;
}

export interface JikanImages {
  jpg: JikanImage;
  webp: JikanImage;
}

export interface JikanTrailer {
  youtube_id: string | null;
  url: string | null;
  embed_url: string | null;
  images: {
    image_url: string | null;
    small_image_url: string | null;
    medium_image_url: string | null;
    large_image_url: string | null;
    maximum_image_url: string | null;
  };
}

export interface JikanTitle {
  type: 'Default' | 'Synonym' | 'Japanese' | 'English';
  title: string;
}

export interface JikanDateProp {
  day: number | null;
  month: number | null;
  year: number | null;
}

export interface JikanAired {
  from: string | null;
  to: string | null;
  prop: {
    from: JikanDateProp;
    to: JikanDateProp;
  };
  string: string | null;
}

export interface JikanBroadcast {
  day: string | null;
  time: string | null;
  timezone: string | null;
  string: string | null;
}

export interface JikanProducer {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface JikanGenre {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface JikanAnimeResponse {
  mal_id: number;
  url: string;
  images: JikanImages;
  trailer: JikanTrailer;
  approved: boolean;
  titles: JikanTitle[];
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  title_synonyms: string[];
  type: 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | 'Music' | 'CM' | 'PV' | 'TV Special';
  source: string | null;
  episodes: number | null;
  status: 'Finished Airing' | 'Currently Airing' | 'Not yet aired';
  airing: boolean;
  aired: JikanAired;
  duration: string | null;
  rating: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  season: 'spring' | 'summer' | 'fall' | 'winter' | null;
  year: number | null;
  broadcast: JikanBroadcast;
  producers: JikanProducer[];
  licensors: JikanProducer[];
  studios: JikanProducer[];
  genres: JikanGenre[];
  explicit_genres: JikanGenre[];
  themes: JikanGenre[];
  demographics: JikanGenre[];
}

export interface JikanPaginatedResponse<T> {
  data: T[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}

export type JikanAnimeListResponse = JikanPaginatedResponse<JikanAnimeResponse>;
