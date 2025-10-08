export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AnimeType = 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | 'Music';
export type AnimeStatus = 'Airing' | 'Finished' | 'Not yet aired';
export type AnimeSeason = 'Winter' | 'Spring' | 'Summer' | 'Fall';
export type SwipeDirection = 'left' | 'right' | 'skip';
export type WatchStatus = 'Watching' | 'Completed' | 'On-Hold' | 'Dropped' | 'Plan to Watch';
export type ExternalSource = 'MAL' | 'AniList' | 'AniDB' | 'Kitsu' | 'TMDB';
export type CoverSize = 'small' | 'medium' | 'large' | 'original';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      anime: {
        Row: {
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
          studios: Json | null;
          producers: Json | null;
          trailer: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mal_id?: number | null;
          title: string;
          title_english?: string | null;
          title_japanese?: string | null;
          synopsis?: string | null;
          type?: AnimeType;
          status?: AnimeStatus;
          episodes?: number | null;
          duration?: number | null;
          aired_from?: string | null;
          aired_to?: string | null;
          season?: AnimeSeason | null;
          year?: number | null;
          score?: number | null;
          scored_by?: number;
          rank?: number | null;
          popularity?: number | null;
          rating?: string | null;
          source?: string | null;
          studios?: Json | null;
          producers?: Json | null;
          trailer?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mal_id?: number | null;
          title?: string;
          title_english?: string | null;
          title_japanese?: string | null;
          synopsis?: string | null;
          type?: AnimeType;
          status?: AnimeStatus;
          episodes?: number | null;
          duration?: number | null;
          aired_from?: string | null;
          aired_to?: string | null;
          season?: AnimeSeason | null;
          year?: number | null;
          score?: number | null;
          scored_by?: number;
          rank?: number | null;
          popularity?: number | null;
          rating?: string | null;
          source?: string | null;
          studios?: Json | null;
          producers?: Json | null;
          trailer?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      genres: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          mal_id: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          mal_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          mal_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      anime_genres: {
        Row: {
          id: string;
          anime_id: string;
          genre_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          anime_id: string;
          genre_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          anime_id?: string;
          genre_id?: string;
          created_at?: string;
        };
      };
      covers: {
        Row: {
          id: string;
          anime_id: string;
          url: string;
          size: CoverSize;
          width: number | null;
          height: number | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          anime_id: string;
          url: string;
          size?: CoverSize;
          width?: number | null;
          height?: number | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          anime_id?: string;
          url?: string;
          size?: CoverSize;
          width?: number | null;
          height?: number | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      external_reviews: {
        Row: {
          id: string;
          anime_id: string;
          source: ExternalSource;
          external_id: string;
          score: number | null;
          review_count: number | null;
          url: string | null;
          last_synced: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          anime_id: string;
          source: ExternalSource;
          external_id: string;
          score?: number | null;
          review_count?: number | null;
          url?: string | null;
          last_synced?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          anime_id?: string;
          source?: ExternalSource;
          external_id?: string;
          score?: number | null;
          review_count?: number | null;
          url?: string | null;
          last_synced?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_reviews: {
        Row: {
          id: string;
          user_id: string;
          anime_id: string;
          rating: number;
          comment: string | null;
          is_spoiler: boolean;
          helpful_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          anime_id: string;
          rating: number;
          comment?: string | null;
          is_spoiler?: boolean;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          anime_id?: string;
          rating?: number;
          comment?: string | null;
          is_spoiler?: boolean;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      swipes: {
        Row: {
          id: string;
          user_id: string;
          anime_id: string;
          direction: SwipeDirection;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          anime_id: string;
          direction: SwipeDirection;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          anime_id?: string;
          direction?: SwipeDirection;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_lists: {
        Row: {
          id: string;
          user_id: string;
          anime_id: string;
          status: WatchStatus;
          episodes_watched: number;
          is_favorite: boolean;
          notes: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          anime_id: string;
          status?: WatchStatus;
          episodes_watched?: number;
          is_favorite?: boolean;
          notes?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          anime_id?: string;
          status?: WatchStatus;
          episodes_watched?: number;
          is_favorite?: boolean;
          notes?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      anime_type: AnimeType;
      anime_status: AnimeStatus;
      anime_season: AnimeSeason;
      swipe_direction: SwipeDirection;
      watch_status: WatchStatus;
      external_source: ExternalSource;
      cover_size: CoverSize;
    };
  };
}
