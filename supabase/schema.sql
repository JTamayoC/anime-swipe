-- ============================================
-- AnimeSwipe Database Schema for Supabase
-- ============================================
-- Execute this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE anime_type AS ENUM ('TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music');
CREATE TYPE anime_status AS ENUM ('Airing', 'Finished', 'Not yet aired');
CREATE TYPE anime_season AS ENUM ('Winter', 'Spring', 'Summer', 'Fall');
CREATE TYPE swipe_direction AS ENUM ('left', 'right', 'skip');
CREATE TYPE watch_status AS ENUM ('Watching', 'Completed', 'On-Hold', 'Dropped', 'Plan to Watch');
CREATE TYPE external_source AS ENUM ('MAL', 'AniList', 'AniDB', 'Kitsu', 'TMDB');
CREATE TYPE cover_size AS ENUM ('small', 'medium', 'large', 'original');

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anime table
CREATE TABLE public.anime (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mal_id INTEGER UNIQUE,
  title TEXT NOT NULL CHECK (char_length(title) > 0),
  title_english TEXT,
  title_japanese TEXT,
  synopsis TEXT,
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
  rating TEXT,
  source TEXT,
  studios JSONB,
  producers JSONB,
  trailer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Genres table
CREATE TABLE public.genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL CHECK (char_length(name) > 0),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  description TEXT,
  mal_id INTEGER UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anime-Genres junction table (many-to-many)
CREATE TABLE public.anime_genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(anime_id, genre_id)
);

-- Covers table
CREATE TABLE public.covers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  size cover_size NOT NULL DEFAULT 'medium',
  width INTEGER CHECK (width >= 0),
  height INTEGER CHECK (height >= 0),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- External Reviews table
CREATE TABLE public.external_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  source external_source NOT NULL,
  external_id TEXT NOT NULL,
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  review_count INTEGER CHECK (review_count >= 0),
  url TEXT,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(anime_id, source)
);

-- User Reviews table
CREATE TABLE public.user_reviews (
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

-- Swipes table
CREATE TABLE public.swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  direction swipe_direction NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);

-- User Lists table (watchlist, favorites, etc)
CREATE TABLE public.user_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  status watch_status NOT NULL DEFAULT 'Plan to Watch',
  episodes_watched INTEGER DEFAULT 0 CHECK (episodes_watched >= 0),
  is_favorite BOOLEAN DEFAULT FALSE,
  notes TEXT CHECK (char_length(notes) <= 1000),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_anime_mal_id ON public.anime(mal_id);
CREATE INDEX idx_anime_title ON public.anime(title);
CREATE INDEX idx_anime_type ON public.anime(type);
CREATE INDEX idx_anime_status ON public.anime(status);
CREATE INDEX idx_anime_year ON public.anime(year);
CREATE INDEX idx_anime_season ON public.anime(season);
CREATE INDEX idx_anime_score ON public.anime(score);

CREATE INDEX idx_genres_name ON public.genres(name);
CREATE INDEX idx_genres_slug ON public.genres(slug);

CREATE INDEX idx_anime_genres_anime_id ON public.anime_genres(anime_id);
CREATE INDEX idx_anime_genres_genre_id ON public.anime_genres(genre_id);

CREATE INDEX idx_covers_anime_id ON public.covers(anime_id);
CREATE INDEX idx_covers_anime_id_primary ON public.covers(anime_id, is_primary);

CREATE INDEX idx_external_reviews_anime_id ON public.external_reviews(anime_id);
CREATE INDEX idx_external_reviews_source ON public.external_reviews(source);

CREATE INDEX idx_user_reviews_user_id ON public.user_reviews(user_id);
CREATE INDEX idx_user_reviews_anime_id ON public.user_reviews(anime_id);
CREATE INDEX idx_user_reviews_rating ON public.user_reviews(rating);
CREATE INDEX idx_user_reviews_helpful_count ON public.user_reviews(helpful_count);

CREATE INDEX idx_swipes_user_id_direction ON public.swipes(user_id, direction);
CREATE INDEX idx_swipes_anime_id ON public.swipes(anime_id);

CREATE INDEX idx_user_lists_user_id_status ON public.user_lists(user_id, status);
CREATE INDEX idx_user_lists_user_id_favorite ON public.user_lists(user_id, is_favorite);
CREATE INDEX idx_user_lists_anime_id ON public.user_lists(anime_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE TRIGGER update_swipes_updated_at BEFORE UPDATE ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_lists_updated_at BEFORE UPDATE ON public.user_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.covers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

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
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.user_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.user_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Swipes policies
CREATE POLICY "Users can view their own swipes" ON public.swipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own swipes" ON public.swipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own swipes" ON public.swipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own swipes" ON public.swipes
  FOR DELETE USING (auth.uid() = user_id);

-- User Lists policies
CREATE POLICY "Users can view their own lists" ON public.user_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own list entries" ON public.user_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own list entries" ON public.user_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own list entries" ON public.user_lists
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update anime score based on user reviews
CREATE OR REPLACE FUNCTION public.update_anime_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.anime
  SET 
    score = (SELECT AVG(rating) FROM public.user_reviews WHERE anime_id = NEW.anime_id),
    scored_by = (SELECT COUNT(*) FROM public.user_reviews WHERE anime_id = NEW.anime_id)
  WHERE id = NEW.anime_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update anime score when review is added/updated/deleted
CREATE TRIGGER update_anime_score_on_review_insert
  AFTER INSERT ON public.user_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_anime_score();

CREATE TRIGGER update_anime_score_on_review_update
  AFTER UPDATE ON public.user_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_anime_score();

CREATE TRIGGER update_anime_score_on_review_delete
  AFTER DELETE ON public.user_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_anime_score();
