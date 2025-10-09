/**
 * Data transformation utilities for Jikan API → Supabase schema
 */

import type { AnimeType, AnimeStatus, AnimeSeason } from '../src/types/anime';
import type { JikanAnimeResponse } from '../src/types/jikan';

// Use the complete Jikan API type definition

/**
 * Transform Jikan API anime type to our enum
 */
function transformAnimeType(jikanType: string): AnimeType {
  const typeMap: Record<string, AnimeType> = {
    TV: 'TV',
    Movie: 'Movie',
    OVA: 'OVA',
    ONA: 'ONA',
    Special: 'Special',
    Music: 'Music',
  };

  return typeMap[jikanType] || 'TV';
}

/**
 * Transform Jikan API status to our enum
 */
function transformAnimeStatus(jikanStatus: string): AnimeStatus {
  const statusMap: Record<string, AnimeStatus> = {
    'Currently Airing': 'Airing',
    'Finished Airing': 'Finished',
    'Not yet aired': 'Not yet aired',
  };

  return statusMap[jikanStatus] || 'Finished';
}

/**
 * Transform Jikan API season to our enum
 */
function transformAnimeSeason(jikanSeason?: string): AnimeSeason | null {
  if (!jikanSeason) return null;

  const seasonMap: Record<string, AnimeSeason> = {
    winter: 'Winter',
    spring: 'Spring',
    summer: 'Summer',
    fall: 'Fall',
  };

  return seasonMap[jikanSeason.toLowerCase()] || null;
}

/**
 * Extract duration in minutes from Jikan duration string
 */
function transformDuration(jikanDuration: string | null): number | null {
  if (!jikanDuration) return null;

  // Parse "24 min per ep" or "1 hr 30 min" etc.
  const match = jikanDuration.match(/(\d+)\s*min/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Transform date string to YYYY-MM-DD format
 */
function transformDate(dateString: string | null): string | null {
  if (!dateString) return null;

  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Transform Jikan anime data to our Supabase schema
 */
export function transformJikanToSupabase(jikanAnime: JikanAnimeResponse) {
  return {
    // Required fields
    mal_id: jikanAnime.mal_id,
    title: jikanAnime.title,
    type: transformAnimeType(jikanAnime.type),
    status: transformAnimeStatus(jikanAnime.status),

    // Text fields
    title_english: jikanAnime.title_english,
    title_japanese: jikanAnime.title_japanese,
    title_synonyms: jikanAnime.title_synonyms?.length > 0 ? jikanAnime.title_synonyms : null,
    synopsis: jikanAnime.synopsis,
    background: jikanAnime.background,

    // Numbers
    episodes: jikanAnime.episodes,
    duration: transformDuration(jikanAnime.duration),
    year: jikanAnime.year,
    score: jikanAnime.score ? Math.round(jikanAnime.score * 100) / 100 : null,
    scored_by: jikanAnime.scored_by ?? 0,
    rank: jikanAnime.rank,
    popularity: jikanAnime.popularity,
    members: jikanAnime.members,
    favorites: jikanAnime.favorites ?? 0,

    // Dates
    aired_from: transformDate(jikanAnime.aired.from),
    aired_to: transformDate(jikanAnime.aired.to),
    season: jikanAnime.season ? transformAnimeSeason(jikanAnime.season) : null,

    // Other fields
    rating: jikanAnime.rating,
    source: jikanAnime.source,

    // JSON arrays
    studios: jikanAnime.studios?.map((studio) => studio.name) || null,
    producers: jikanAnime.producers?.map((producer) => producer.name) || null,
    licensors: jikanAnime.licensors?.map((licensor) => licensor.name) || null,

    // Broadcast information
    broadcast: jikanAnime.broadcast
      ? {
          day: jikanAnime.broadcast.day,
          time: jikanAnime.broadcast.time,
          timezone: jikanAnime.broadcast.timezone,
          string: jikanAnime.broadcast.string,
        }
      : null,

    // Media and URLs
    trailer: jikanAnime.trailer?.embed_url ?? jikanAnime.trailer?.url ?? null,
    mal_url: jikanAnime.url,

    // Status flags
    approved: jikanAnime.approved,
    airing: jikanAnime.airing,

    // Timestamps (will be set by DB)
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Transform Jikan covers data - extract multiple image sizes
 */
export function transformJikanCovers(jikanAnime: JikanAnimeResponse, animeId: string) {
  const covers = [];

  // Large image (primary cover)
  if (jikanAnime.images.jpg.large_image_url) {
    covers.push({
      anime_id: animeId,
      url: jikanAnime.images.jpg.large_image_url,
      size: 'large' as const,
      width: null,
      height: null,
      is_primary: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Medium/standard image
  if (
    jikanAnime.images.jpg.image_url &&
    jikanAnime.images.jpg.image_url !== jikanAnime.images.jpg.large_image_url
  ) {
    covers.push({
      anime_id: animeId,
      url: jikanAnime.images.jpg.image_url,
      size: 'medium' as const,
      width: null,
      height: null,
      is_primary: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Small/thumbnail image
  if (
    jikanAnime.images.jpg.small_image_url &&
    jikanAnime.images.jpg.small_image_url !== jikanAnime.images.jpg.image_url
  ) {
    covers.push({
      anime_id: animeId,
      url: jikanAnime.images.jpg.small_image_url,
      size: 'small' as const,
      width: null,
      height: null,
      is_primary: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // WebP versions if available and different
  if (
    jikanAnime.images.webp?.large_image_url &&
    jikanAnime.images.webp.large_image_url !== jikanAnime.images.jpg.large_image_url
  ) {
    covers.push({
      anime_id: animeId,
      url: jikanAnime.images.webp.large_image_url,
      size: 'large' as const,
      width: null,
      height: null,
      is_primary: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return covers;
}

/**
 * Transform Jikan genres data - includes all genre types
 */
export function transformJikanGenres(jikanAnime: JikanAnimeResponse) {
  // Combine all genre types: genres, explicit_genres, themes, demographics
  const allGenres = [
    ...(jikanAnime.genres || []),
    ...(jikanAnime.explicit_genres || []),
    ...(jikanAnime.themes || []),
    ...(jikanAnime.demographics || []),
  ];

  // Remove duplicates based on mal_id
  const uniqueGenres = allGenres.filter(
    (genre, index, self) => index === self.findIndex((g) => g.mal_id === genre.mal_id)
  );

  return uniqueGenres.map((genre) => ({
    name: genre.name,
    slug: genre.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''),
    description: null,
    mal_id: genre.mal_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}
