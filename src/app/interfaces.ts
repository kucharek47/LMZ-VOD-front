export interface ElementWideo {
  id: number;
  tytul: string;
  opis: string;
  data_premiery: string;
  plakat_url: string;
  trailer_url: string;
  bezpieczny_trailer_url?: any;
  ocena_srednia: number;
  ocena_glosy: number;
  czas_trwania: number;
  rok: number;
  kategoria?: string;
  czy_serial: boolean;
  odcinek_id?: number;
  data_ogladania?: string;
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
  trailer_src: string;
  ocena: number;
  liczba_glosow: number;
  czas_trwania: number;
  file_path?: string;
  genres?: string[];
}

export interface SerialDto {
  id: number;
  title: string;
  description: string;
  release_date: string;
  poster_path: string;
  trailer_url: string;
  trailer_src: string;
  ocena: number;
  liczba_glosow: number;
  czas_trwania: number;
  seasons_count?: number;
  genres?: string[];
}

export interface OstatnioDto {
  media_id: number;
  tytul: string;
  plakat_url: string;
  typ_media: string;
  obejrzany_czas: number;
  data_aktualizacji: string;
  numer_sezonu?: number;
  numer_odcinka?: number;
  odcinek_id?: number;
}

export interface I_Postep {
  media_id: number;
  odcinek_id: number | null;
  aktualny_czas: number;
  calkowity_czas: number;
}
