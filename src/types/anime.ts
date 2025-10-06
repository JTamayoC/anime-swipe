export type Anime = {
  mal_id: number;
  title: string;
  images: { jpg: { large_image_url: string } };
  score: number;
  type: string;
  episodes: number;
  synopsis: string;
};
