export interface ElementWideo {
  id: number;
  tytul: string;
  opis: string;
  plakat_url: string;
  trailer_url: string;
  ocena: number;
  rok: number;
  kategoria?: string;
  czy_serial: boolean;
}

export interface Kategoria {
  id: string;
  nazwa: string;
}

export interface FilmDto {
  id: number;
  title: string;
  description: string;
  release_date: string;
  poster_path: string;
  trailer_url: string;
  file_path: string;
  genres: string[];
}

export interface SerialDto {
  id: number;
  title: string;
  description: string;
  poster_path: string;
  genres: string[];
  seasons_count: number;
}

export interface OstatnioDto {
  media_id: number;
  tytul: string;
  plakat_url: string;
  typ_media: string;
  obejrzany_czas: number;
}
