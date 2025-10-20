-- ============================================
-- AnimeSwipe Database Schema for Supabase (fixed)
-- ============================================
-- Execute in Supabase SQL Editor

-- -----------------------
-- EXTENSIONS
-- -----------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- pgvector extension (Supabase supports this)
CREATE EXTENSION IF NOT EXISTS vector;

-- -----------------------
-- ENUMS
-- -----------------------
CREATE TYPE anime_type AS ENUM ('TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music');
CREATE TYPE anime_status AS ENUM ('Airing', 'Finished', 'Not yet aired');
CREATE TYPE anime_season AS ENUM ('Winter', 'Spring', 'Summer', 'Fall');
CREATE TYPE swipe_direction AS ENUM ('left', 'right', 'skip');
CREATE TYPE watch_status AS ENUM ('Watching', 'Completed', 'On-Hold', 'Dropped', 'Plan to Watch', 'Not Interested');
CREATE TYPE preference_status AS ENUM ('Liked', 'Disliked');
CREATE TYPE external_source AS ENUM ('MAL', 'AniList', 'AniDB', 'Kitsu', 'TMDB');
CREATE TYPE cover_size AS ENUM ('small', 'medium', 'large');

-- -----------------------
-- TABLES
-- -----------------------

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anime table (with embedding vector)
CREATE TABLE IF NOT EXISTS public.anime (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mal_id INTEGER UNIQUE,
  title TEXT NOT NULL CHECK (char_length(title) > 0),
  title_english TEXT,
  title_japanese TEXT,
  title_synonyms JSONB,
  synopsis TEXT,
  background TEXT,
  type anime_type NOT NULL DEFAULT 'TV',
  status anime_status NOT NULL DEFAULT 'Finished',
  episodes INTEGER CHECK (episodes >= 0),
  duration INTEGER CHECK (duration >= 0),
  aired_from DATE,
  aired_to DATE,
  season anime_season,
  year INTEGER CHECK (year >= 1900 AND year <= 2100),
  score NUMERIC(3,2) CHECK (score >= 0 AND score <= 10),
  scored_by INTEGER DEFAULT 0 CHECK (scored_by >= 0),
  rank INTEGER,
  popularity INTEGER,
  members INTEGER CHECK (members >= 0),
  favorites INTEGER DEFAULT 0 CHECK (favorites >= 0),
  rating TEXT,
  source TEXT,
  studios JSONB,
  producers JSONB,
  licensors JSONB,
  streaming JSONB,
  broadcast JSONB,
  trailer TEXT,
  mal_url TEXT,
  approved BOOLEAN DEFAULT true,
  airing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- embedding vector column for semantic search / recommendations
  embedding VECTOR(1536)
);

-- Genres table (with genre_vector instead of ambiguous cat_vector)
CREATE TABLE IF NOT EXISTS public.genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL CHECK (char_length(name) > 0),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  description TEXT,
  mal_id INTEGER UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- explicit vector/embedding for genre (previously called "cat_vector" in other schemas)
  genre_vector VECTOR(1536)
);

-- Anime-Genres junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.anime_genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(anime_id, genre_id)
);

-- Covers table
CREATE TABLE IF NOT EXISTS public.covers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  size cover_size NOT NULL DEFAULT 'medium',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- External Reviews table
CREATE TABLE IF NOT EXISTS public.external_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  source external_source NOT NULL,
  external_id TEXT NOT NULL,
  author TEXT,
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  review_text TEXT,
  published_at TIMESTAMPTZ,
  url TEXT,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(anime_id, source, external_id)
);

-- User Reviews table
CREATE TABLE IF NOT EXISTS public.user_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  rating NUMERIC(3,1) NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment TEXT CHECK (char_length(comment) <= 2000),
  is_spoiler BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);

-- User Lists table (watchlist / swipes)
CREATE TABLE IF NOT EXISTS public.user_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  status watch_status NOT NULL DEFAULT 'Plan to Watch',
  preference preference_status,
  is_favorite BOOLEAN DEFAULT FALSE,
  notes TEXT CHECK (char_length(notes) <= 1000),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);

-- User Genre Preferences table
CREATE TABLE IF NOT EXISTS public.user_genre_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  weight NUMERIC(9,6) NOT NULL CHECK (weight >= 0 AND weight <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, genre_id)
);

-- -----------------------
-- INDEXES
-- -----------------------
CREATE INDEX IF NOT EXISTS idx_anime_mal_id ON public.anime(mal_id);
CREATE INDEX IF NOT EXISTS idx_anime_title ON public.anime(title);
CREATE INDEX IF NOT EXISTS idx_anime_type ON public.anime(type);
CREATE INDEX IF NOT EXISTS idx_anime_status ON public.anime(status);
CREATE INDEX IF NOT EXISTS idx_anime_year ON public.anime(year);
CREATE INDEX IF NOT EXISTS idx_anime_season ON public.anime(season);
CREATE INDEX IF NOT EXISTS idx_anime_score ON public.anime(score);
CREATE INDEX IF NOT EXISTS idx_anime_members ON public.anime(members);
CREATE INDEX IF NOT EXISTS idx_anime_favorites ON public.anime(favorites);
CREATE INDEX IF NOT EXISTS idx_anime_airing ON public.anime(airing);
CREATE INDEX IF NOT EXISTS idx_anime_approved ON public.anime(approved);

CREATE INDEX IF NOT EXISTS idx_genres_name ON public.genres(name);
CREATE INDEX IF NOT EXISTS idx_genres_slug ON public.genres(slug);

CREATE INDEX IF NOT EXISTS idx_anime_genres_anime_id ON public.anime_genres(anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_genres_genre_id ON public.anime_genres(genre_id);

CREATE INDEX IF NOT EXISTS idx_covers_anime_id ON public.covers(anime_id);
CREATE INDEX IF NOT EXISTS idx_covers_anime_id_primary ON public.covers(anime_id, is_primary);

CREATE INDEX IF NOT EXISTS idx_external_reviews_anime_id ON public.external_reviews(anime_id);
CREATE INDEX IF NOT EXISTS idx_external_reviews_source ON public.external_reviews(source);

CREATE INDEX IF NOT EXISTS idx_user_reviews_user_id ON public.user_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_anime_id ON public.user_reviews(anime_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_rating ON public.user_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_user_reviews_helpful_count ON public.user_reviews(helpful_count);

CREATE INDEX IF NOT EXISTS idx_user_lists_user_id_status ON public.user_lists(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_lists_user_id_favorite ON public.user_lists(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_user_lists_anime_id ON public.user_lists(anime_id);
CREATE INDEX IF NOT EXISTS idx_user_lists_user_id_preference ON public.user_lists(user_id, preference);

CREATE INDEX IF NOT EXISTS idx_user_genre_preferences_user_id ON public.user_genre_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_genre_preferences_genre_id ON public.user_genre_preferences(genre_id);

-- VECTOR indexes (pgvector). Note: ivfflat is approximate NN; you must choose lists param wisely for your corpus size.
-- For smaller datasets you can use a brute-force index, but ivfflat is common for embeddings.
DO $$
BEGIN
  -- create ivfflat index for anime.embedding if vector column exists
  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid WHERE c.relname='anime' AND a.attname='embedding') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_anime_embedding_ivfflat ON public.anime USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid WHERE c.relname='genres' AND a.attname='genre_vector') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_genres_genre_vector_ivfflat ON public.genres USING ivfflat (genre_vector vector_l2_ops) WITH (lists = 32);';
  END IF;
END;
$$;

-- -----------------------
-- TRIGGER: updated_at helper
-- -----------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- attach updated_at trigger to tables that have updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anime_updated_at BEFORE UPDATE ON public.anime
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_genres_updated_at BEFORE UPDATE ON public.genres
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_covers_updated_at BEFORE UPDATE ON public.covers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_reviews_updated_at BEFORE UPDATE ON public.external_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_reviews_updated_at BEFORE UPDATE ON public.user_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_lists_updated_at BEFORE UPDATE ON public.user_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_genre_preferences_updated_at BEFORE UPDATE ON public.user_genre_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------
-- ROW LEVEL SECURITY (RLS) - enable AFTER tables exist
-- -----------------------
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.anime_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.covers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.external_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_genre_preferences ENABLE ROW LEVEL SECURITY;

-- -----------------------
-- POLICIES
-- -----------------------

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING ((SELECT auth.uid()) = id);

-- Anime policies (public read, admin write)
CREATE POLICY "Anyone can view anime" ON public.anime
  FOR SELECT USING (true);

-- Genres policies (public read)
CREATE POLICY "Anyone can view genres" ON public.genres
  FOR SELECT USING (true);

-- Anime-Genres policies (public read)
CREATE POLICY "Anyone can view anime genres" ON public.anime_genres
  FOR SELECT USING (true);

-- Covers policies (public read)
CREATE POLICY "Anyone can view covers" ON public.covers
  FOR SELECT USING (true);

-- External Reviews policies (public read)
CREATE POLICY "Anyone can view external reviews" ON public.external_reviews
  FOR SELECT USING (true);

-- User Reviews policies
CREATE POLICY "Anyone can view user reviews" ON public.user_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON public.user_reviews
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own reviews" ON public.user_reviews
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.user_reviews
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- User Lists policies
CREATE POLICY "Users can view their own lists" ON public.user_lists
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own list entries" ON public.user_lists
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own list entries" ON public.user_lists
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own list entries" ON public.user_lists
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- User Genre Preferences policies
CREATE POLICY "Users can view their own genre preferences" ON public.user_genre_preferences
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own genre preferences" ON public.user_genre_preferences
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own genre preferences" ON public.user_genre_preferences
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own genre preferences" ON public.user_genre_preferences
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- -----------------------
-- FUNCTIONS: user onboarding / triggers
-- -----------------------

-- Function to handle new user creation (triggered by auth.users row create; wire via Supabase auth trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- If using Supabase Auth database trigger, attach accordingly (Supabase typically wires auth triggers automatically).
-- (Supabase has a recommended function name and trigger configuration—use project's auth functions.)

-- Function to update anime score based on user reviews (INSERT/UPDATE)
CREATE OR REPLACE FUNCTION public.update_anime_score_insert_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public.anime
  SET
    score = (
      SELECT ROUND(COALESCE(AVG(rating),0)::numeric,2) FROM public.user_reviews WHERE anime_id = NEW.anime_id
    ),
    scored_by = (
      SELECT COUNT(*) FROM public.user_reviews WHERE anime_id = NEW.anime_id
    )
  WHERE id = NEW.anime_id;
  RETURN NEW;
END;
$$;

-- Function to update anime score based on user reviews (DELETE)
CREATE OR REPLACE FUNCTION public.update_anime_score_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public.anime
  SET
    score = (
      SELECT ROUND(COALESCE(AVG(rating),0)::numeric,2) FROM public.user_reviews WHERE anime_id = OLD.anime_id
    ),
    scored_by = (
      SELECT COUNT(*) FROM public.user_reviews WHERE anime_id = OLD.anime_id
    )
  WHERE id = OLD.anime_id;
  RETURN OLD;
END;
$$;

-- Triggers to update anime score when review is added/updated/deleted
CREATE TRIGGER update_anime_score_on_review_insert
  AFTER INSERT ON public.user_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_anime_score_insert_update();

CREATE TRIGGER update_anime_score_on_review_update
  AFTER UPDATE ON public.user_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_anime_score_insert_update();

CREATE TRIGGER update_anime_score_on_review_delete
  AFTER DELETE ON public.user_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_anime_score_delete();

-- -----------------------
-- GENRE PREFERENCES NORMALIZATION
-- -----------------------
CREATE OR REPLACE FUNCTION public.normalize_user_genre_weights(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(weight), 0) INTO total
  FROM public.user_genre_preferences
  WHERE user_id = p_user_id;

  IF total > 0 THEN
    UPDATE public.user_genre_preferences
    SET weight = LEAST(weight / total, 1.0),  -- Ensure no weight exceeds 1.0
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- -----------------------
-- RECOMMENDATION FUNCTIONS
-- -----------------------

-- Function to get weighted genre recommendations for a user
CREATE OR REPLACE FUNCTION public.get_weighted_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  title_english TEXT,
  title_japanese TEXT,
  type anime_type,
  episodes INTEGER,
  score NUMERIC(3,2),
  synopsis TEXT,
  year INTEGER,
  status anime_status
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT a.id,
         a.title,
         a.title_english,
         a.title_japanese,
         a.type,
         a.episodes,
         a.score,
         a.synopsis,
         a.year,
         a.status
  FROM public.anime a
  JOIN public.anime_genres ag ON ag.anime_id = a.id
  JOIN public.user_genre_preferences ugp ON ugp.genre_id = ag.genre_id
  LEFT JOIN public.user_lists ul ON ul.user_id = ugp.user_id AND ul.anime_id = a.id
  WHERE ugp.user_id = p_user_id
    AND ul.anime_id IS NULL -- exclude anime already in user_lists (any interaction)
  GROUP BY a.id, a.title, a.title_english, a.title_japanese, a.type, a.episodes, a.score, a.synopsis, a.year, a.status
  ORDER BY SUM(ugp.weight) DESC NULLS LAST, a.score DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- Function to update genre weights from user actions (swipes/watches)
CREATE OR REPLACE FUNCTION public.update_genre_weights_from_action(
  p_user_id UUID,
  p_anime_id UUID,
  p_delta NUMERIC(9,6) DEFAULT 0.1
)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  -- Increment weights for all genres of the anime
  INSERT INTO public.user_genre_preferences (user_id, genre_id, weight)
  SELECT p_user_id, ag.genre_id, GREATEST(p_delta, 0)  -- Ensure positive delta for new entries
  FROM public.anime_genres ag
  WHERE ag.anime_id = p_anime_id
  ON CONFLICT (user_id, genre_id)
  DO UPDATE SET
    weight = GREATEST(LEAST(public.user_genre_preferences.weight + p_delta, 1.0), 0.0),  -- Clamp between 0 and 1
    updated_at = NOW();

  -- Normalize so the weights sum to 1 (keeps DB-consistent)
  PERFORM public.normalize_user_genre_weights(p_user_id);
END;
$$;

-- -----------------------
-- EMBEDDING helper functions (pgvector)
-- -----------------------

-- Set anime embedding (pass a vector value into SQL from your ingestion pipeline)
CREATE OR REPLACE FUNCTION public.set_anime_embedding(p_anime_id UUID, p_embedding vector)
RETURNS VOID LANGUAGE sql AS $$
  UPDATE public.anime SET embedding = p_embedding, updated_at = NOW() WHERE id = p_anime_id;
$$;

-- Set genre embedding
CREATE OR REPLACE FUNCTION public.set_genre_embedding(p_genre_id UUID, p_embedding vector)
RETURNS VOID LANGUAGE sql AS $$
  UPDATE public.genres SET genre_vector = p_embedding, updated_at = NOW() WHERE id = p_genre_id;
$$;

-- Example function to find nearest anime by embedding (returns top k)
CREATE OR REPLACE FUNCTION public.search_anime_by_embedding(p_embedding vector, p_limit INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title TEXT,
  distance FLOAT
) LANGUAGE sql AS $$
  SELECT id, title, (embedding <=> p_embedding) as distance
  FROM public.anime
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> p_embedding
  LIMIT p_limit;
$$;

-- -----------------------
-- EXAMPLE USAGE (replace with your real embedding values)
-- -----------------------
-- -- Update anime embedding (example):
-- UPDATE public.anime
-- SET embedding = '[0.001, -0.02, 0.44, ...]'::vector
-- WHERE id = 'your-anime-uuid';

-- -- Or call helper:
-- SELECT public.set_anime_embedding('your-anime-uuid', '[0.001, -0.02, 0.44, ...]'::vector);

-- -- Update genre embedding:
-- SELECT public.set_genre_embedding('your-genre-uuid', '[0.01, 0.02, ...]'::vector);

-- -- Semantic search:
-- SELECT * FROM public.search_anime_by_embedding('[0.01, -0.02, ...]'::vector, 5);

-- End of script
