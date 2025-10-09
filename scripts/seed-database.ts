/**
 * Seed Supabase database with anime data from Jikan API
 *
 * Usage: npm run seed
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

import {
  transformJikanToSupabase,
  transformJikanCovers,
  transformJikanGenres,
} from './transform-jikan-data';

import type { JikanAnimeResponse } from '../src/types/jikan';

// Supabase setup - use secret key for admin operations, fallback to public key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

const supabaseKey = supabaseSecretKey ?? supabasePublicKey;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file contains:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error(
    '- SUPABASE_SECRET_KEY (for seeding) or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'
  );
  process.exit(1);
}

console.log(`🔗 Connecting to Supabase using ${supabaseSecretKey ? 'secret' : 'public'} key...`);
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Insert genres and return a map of name -> id
 */
async function insertGenres(
  genresData: Array<{
    name: string;
    slug: string;
    description: string | null;
    mal_id: number | null;
    created_at: string;
    updated_at: string;
  }>
) {
  console.log('📝 Processing genres...');

  // Get unique genres
  const uniqueGenres = Array.from(new Map(genresData.map((g) => [g.name, g])).values());

  console.log(`📥 Inserting ${uniqueGenres.length} unique genres...`);

  const { data, error } = await supabase
    .from('genres')
    .upsert(uniqueGenres, { onConflict: 'name' })
    .select('id, name');

  if (error) {
    console.error('❌ Failed to insert genres:', error);
    return new Map();
  }

  // Create name -> id map
  const genreMap = new Map(data.map((g: { name: string; id: string }) => [g.name, g.id]));
  console.log(`✅ Inserted genres successfully`);

  return genreMap;
}

/**
 * Insert or update anime data (upsert based on mal_id)
 */
async function insertAnime(animeData: ReturnType<typeof transformJikanToSupabase>[]) {
  console.log(`📥 Upserting ${animeData.length} anime...`);

  const { data, error } = await supabase
    .from('anime')
    .upsert(animeData, {
      onConflict: 'mal_id',
      ignoreDuplicates: false,
    })
    .select('id, mal_id');

  if (error) {
    console.error('❌ Failed to upsert anime:', error);
    console.error('Error details:', error);
    return [];
  }

  console.log(`✅ Upserted ${data.length} anime successfully`);
  return data;
}

/**
 * Insert covers for anime (with conflict handling)
 */
async function insertCovers(coversData: ReturnType<typeof transformJikanCovers>) {
  if (coversData.length === 0) return;

  console.log(`📥 Inserting ${coversData.length} covers...`);

  // First, delete existing covers for these anime to avoid duplicates
  const animeIds = Array.from(new Set(coversData.map((cover) => cover.anime_id)));

  if (animeIds.length > 0) {
    console.log(`🗑️  Cleaning existing covers for ${animeIds.length} anime...`);
    const { error: deleteError } = await supabase.from('covers').delete().in('anime_id', animeIds);

    if (deleteError) {
      console.error('⚠️  Warning: Failed to clean existing covers:', deleteError);
    }
  }

  // Insert new covers
  const { error } = await supabase.from('covers').insert(coversData);

  if (error) {
    console.error('❌ Failed to insert covers:', error);
    return;
  }

  console.log(`✅ Inserted covers successfully`);
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  console.log('==================================');

  try {
    // Fetch ALL data from Jikan API (iterate all pages)
    const allAnimeData = [];
    const allGenresData = [];
    const allJikanData = [];

    let page = 1;
    let hasNext = true;
    while (hasNext) {
      const response = await fetch(`https://api.jikan.moe/v4/anime?page=${page}&limit=25`);
      if (!response.ok) {
        console.error(`❌ Error fetching page ${page}: HTTP ${response.status}`);
        break;
      }
      const data = await response.json();
      const jikanAnime: JikanAnimeResponse[] = data.data;
      // Filtrar solo series (type === 'TV'), score > 5, al menos 2 episodios, y status válido
      const filteredAnime = jikanAnime.filter(
        (anime) =>
          anime.type === 'TV' &&
          (anime.score ?? 0) > 5 &&
          (anime.episodes ?? 0) > 1 &&
          ['Currently Airing', 'Finished Airing', 'Not yet aired'].includes(anime.status)
      );
      if (filteredAnime.length > 0) {
        for (const anime of filteredAnime) {
          allJikanData.push(anime);
          const transformedAnime = transformJikanToSupabase(anime);
          allAnimeData.push(transformedAnime);
          const genres = transformJikanGenres(anime);
          allGenresData.push(...genres);
        }
        console.log(
          `📦 Página ${page} descargada: ${filteredAnime.length} series (Total acumulado: ${allAnimeData.length})`
        );
      } else {
        console.log(
          `📦 Página ${page} descargada: 0 series (Total acumulado: ${allAnimeData.length})`
        );
      }
      hasNext = data.pagination?.has_next_page;
      page++;
      if (hasNext) {
        console.log('⏳ Waiting 1 second (rate limiting)...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    console.log(`✅ Total animes fetched: ${allAnimeData.length}`);

    // Insert data
    console.log('\n🗄️  Inserting into database...');
    console.log('================================');

    // 1. Insert genres first
    const genreMap = await insertGenres(allGenresData);

    // 2. Insert anime
    const insertedAnime = await insertAnime(allAnimeData);

    // 3. Relacionar anime y géneros en anime_genres
    const animeGenresData = [];
    for (let i = 0; i < insertedAnime.length; i++) {
      const animeId = insertedAnime[i].id;
      const malId = insertedAnime[i].mal_id;
      // Buscar el Jikan original
      const originalJikan = allJikanData.find((a) => a.mal_id === malId);
      if (originalJikan) {
        // Obtener géneros únicos de este anime
        const genres = transformJikanGenres(originalJikan);
        for (const genre of genres) {
          const genreId = genreMap.get(genre.name);
          if (genreId) {
            animeGenresData.push({ anime_id: animeId, genre_id: genreId });
          }
        }
      }
    }
    if (animeGenresData.length > 0) {
      console.log(`\n🔗 Relacionando ${animeGenresData.length} anime_genres...`);
      const { error: agError } = await supabase
        .from('anime_genres')
        .upsert(animeGenresData, { onConflict: 'anime_id,genre_id' });
      if (agError) {
        console.error('❌ Error insertando anime_genres:', agError);
      } else {
        console.log('✅ Relaciones anime_genres insertadas correctamente');
      }
    }

    // 4. Create covers with anime IDs
    const allCoversData = [];
    for (let i = 0; i < insertedAnime.length; i++) {
      const animeId = insertedAnime[i].id;
      const malId = insertedAnime[i].mal_id;

      // Find original jikan data by mal_id (using stored data, no re-fetch)
      const originalJikan = allJikanData.find((a) => a.mal_id === malId);

      if (originalJikan) {
        const covers = transformJikanCovers(originalJikan, animeId);
        allCoversData.push(...covers);
      }
    }

    // 5. Insert covers
    await insertCovers(allCoversData);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${insertedAnime.length} anime inserted`);
    console.log(`   - ${genreMap.size} genres inserted`);
    console.log(`   - ${animeGenresData.length} anime_genres inserted`);
    console.log(`   - ${allCoversData.length} covers inserted`);
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeder
await seedDatabase();
