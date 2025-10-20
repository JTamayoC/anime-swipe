import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

import type { SupabaseClient } from '@supabase/supabase-js';

async function getUserInteractedAnimeIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data: userLists, error } = await supabase
    .from('user_lists')
    .select('anime_id')
    .eq('user_id', userId);

  if (error || !userLists || userLists.length === 0) {
    return [];
  }

  return userLists.map((ul: { anime_id: string }) => ul.anime_id);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user.user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user genre preferences
    const { data: prefs, error: prefsError } = await supabase
      .from('user_genre_preferences')
      .select('genre_id, weight');

    if (prefsError) {
      console.error('Prefs error:', prefsError);
      return NextResponse.json({ error: prefsError.message }, { status: 500 });
    }

    if (!prefs || prefs.length === 0) {
      // No preferences, return random anime excluding already interacted ones
      console.error('No preferences, returning random anime excluding user interactions');
      const interactedIds = await getUserInteractedAnimeIds(supabase, user.user.id);

      let query = supabase
        .from('anime')
        .select(
          `
          id,
          title,
          title_english,
          title_japanese,
          type,
          episodes,
          score,
          synopsis,
          year,
          status,
          covers (*),
          anime_genres (
            genres (
              id,
              name
            )
          )
        `
        )
        .limit(100);

      if (interactedIds.length > 0) {
        // Use raw SQL filter to avoid array serialization issues
        const idsList = interactedIds.join(',');
        query = query.filter('id', 'not.in', `(${idsList})`);
      }
    }

    console.error(`Found ${prefs.length} preferences, using weighted recommendations`);

    // Use SQL-based weighted recommendations instead of JS cosine similarity
    const { data: recommendations, error: recError } = await supabase.rpc(
      'get_weighted_recommendations',
      { p_user_id: user.user.id, p_limit: 100 }
    );

    if (recError) {
      console.error('Recommendation error:', recError);
      // Fallback to random anime if recommendation fails, excluding already interacted ones
      const interactedIds = await getUserInteractedAnimeIds(supabase, user.user.id);

      let query = supabase
        .from('anime')
        .select(
          `
          id,
          title,
          title_english,
          title_japanese,
          type,
          episodes,
          score,
          synopsis,
          year,
          status,
          covers (*),
          anime_genres (
            genres (
              id,
              name
            )
          )
        `
        )
        .limit(100);

      if (interactedIds.length > 0) {
        // Use raw SQL filter to avoid array serialization issues
        const idsList = interactedIds.join(',');
        query = query.filter('id', 'not.in', `(${idsList})`);
      }
    }

    console.error('Weighted recommendations calculated successfully');

    // Fetch covers and genres for the recommended anime
    if (recommendations && recommendations.length > 0) {
      const animeIds = recommendations.map((rec: { id: string }) => rec.id);
      if (animeIds.length > 0) {
        const { data: covers } = await supabase.from('covers').select('*').in('anime_id', animeIds);

        const { data: animeGenres } = await supabase
          .from('anime_genres')
          .select(
            `
            *,
            genres (*)
          `
          )
          .in('anime_id', animeIds);

        // Add covers and genres to recommendations
        const recommendationsWithData = recommendations.map((rec: { id: string }) => ({
          ...rec,
          covers: covers?.filter((c: { anime_id: string }) => c.anime_id === rec.id) ?? [],
          anime_genres:
            animeGenres?.filter((ag: { anime_id: string }) => ag.anime_id === rec.id) ?? [],
        }));

        return NextResponse.json(recommendationsWithData);
      }
    }

    return NextResponse.json(recommendations ?? []);
  } catch (error) {
    console.error('Unexpected error in recommendations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
