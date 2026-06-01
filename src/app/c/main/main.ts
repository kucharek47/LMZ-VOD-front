import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ElementWideo, Kategoria, FilmDto, SerialDto, OstatnioDto } from '../../interfaces';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class MainComponent implements OnInit, OnDestroy {
  router = inject(Router);
  http = inject(HttpClient);
  sanitizer = inject(DomSanitizer);

  aktywna_wyspa = signal<ElementWideo | null>(null);
  czy_gra_zwiastun = signal<boolean>(false);
  czy_zainicjowano_wyspe = false;

  lista_ostatnio = signal<ElementWideo[]>([]);
  lista_filmy = signal<ElementWideo[]>([]);
  lista_seriale = signal<ElementWideo[]>([]);

  lista_kategorii = signal<Kategoria[]>([]);
  wybrana_kategoria = signal<string>('');

  id_timeout: ReturnType<typeof setTimeout> | undefined;
  id_timeout_hover: ReturnType<typeof setTimeout> | undefined;
  id_timeout_scroll: ReturnType<typeof setTimeout> | undefined;

  ngOnInit() {
    this.laduj_kategorie();
    this.odswiez_ostatnio();
    this.odswiez_seriale();
  }

  ngOnDestroy() {
    clearTimeout(this.id_timeout);
    clearTimeout(this.id_timeout_hover);
    clearTimeout(this.id_timeout_scroll);
  }

  buduj_url(sciezka: string | null | undefined): string {
    if (!sciezka) return '';
    if (sciezka.startsWith('http')) return sciezka;
    return `/${sciezka}`;
  }

  konwertuj_na_bezpieczny_youtube(url: string | null | undefined): SafeResourceUrl | null {
    if (!url) return null;

    const dopasowanie = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/))([^&?]*)/);

    if (dopasowanie && dopasowanie[1]) {
      const id_wideo = dopasowanie[1];
      const url_embed = `https://www.youtube.com/embed/${id_wideo}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id_wideo}&modestbranding=1&rel=0`;

      return this.sanitizer.bypassSecurityTrustResourceUrl(url_embed);
    }

    return null;
  }

  ustaw_poczatkowa_wyspe(wyniki: ElementWideo[]) {
    if (!this.czy_zainicjowano_wyspe && wyniki.length > 0) {
      this.czy_zainicjowano_wyspe = true;

      const wideo_z_trailerem = wyniki.filter((w) => w.trailer_url && w.trailer_url.trim() !== '');
      const pula_losowania = wideo_z_trailerem.length > 0 ? wideo_z_trailerem : wyniki;

      const wideo_losowe = pula_losowania[Math.floor(Math.random() * pula_losowania.length)];

      this.aktywna_wyspa.set(wideo_losowe);
      this.czy_gra_zwiastun.set(false);
      clearTimeout(this.id_timeout);

      this.id_timeout = setTimeout(() => {
        this.czy_gra_zwiastun.set(true);
      }, 3000);
    }
  }

  laduj_kategorie() {
    this.http.get<string[]>(`/wideo/kategoria_list`).subscribe((dane) => {
      const mapowane_kategorie = dane.map((k) => ({ id: k, nazwa: k }));
      this.lista_kategorii.set(mapowane_kategorie);

      if (mapowane_kategorie.length > 0) {
        this.wybrana_kategoria.set(mapowane_kategorie[0].id);
        this.odswiez_filmy();
      }
    });
  }

  formatuj_date(data_iso: string): string {
    if (!data_iso) return '';
    const d = new Date(data_iso);
    return d.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  odswiez_ostatnio() {
    this.http.get<OstatnioDto[]>(`/wideo/ostatnio_ogladane`).subscribe((dane) => {
      const wynik = dane.map((d) => ({
        id: d.media_id,
        tytul: d.tytul,
        opis: '',
        data_premiery: '',
        plakat_url: this.buduj_url(d.plakat_url),
        trailer_url: '',
        bezpieczny_trailer_url: null,
        ocena_srednia: 0,
        ocena_glosy: 0,
        czas_trwania: 0,
        rok: 0,
        czy_serial: d.typ_media === 'serial',
        odcinek_id: d.odcinek_id,
        data_ogladania: this.formatuj_date(d.data_aktualizacji),
      }));
      this.lista_ostatnio.set(wynik);
    });
  }

  odswiez_filmy() {
    const kategoria = this.wybrana_kategoria();
    let url_endpoint = `/wideo/filmy_list?limit=10`;

    if (kategoria) {
      url_endpoint += `&kategoria=${kategoria}`;
    }

    this.http.get<FilmDto[]>(url_endpoint).subscribe((dane) => {
      const wynik = dane.map((d) => ({
        id: d.id,
        tytul: d.title,
        opis: d.description || '',
        data_premiery: d.release_date || '',
        plakat_url: this.buduj_url(d.poster_path),
        trailer_url: d.trailer_url || '',
        bezpieczny_trailer_url: this.konwertuj_na_bezpieczny_youtube(d.trailer_url),
        ocena_srednia: d.ocena || 0,
        ocena_glosy: d.liczba_glosow || 0,
        czas_trwania: d.czas_trwania || 0,
        rok: d.release_date ? new Date(d.release_date).getFullYear() : 0,
        czy_serial: false,
      }));

      this.lista_filmy.set(wynik);
      this.ustaw_poczatkowa_wyspe(wynik);
    });
  }

  odswiez_seriale() {
    this.http.get<SerialDto[]>(`/wideo/seriale_list?limit=9`).subscribe((dane) => {
      const wynik = dane.map((d) => ({
        id: d.id,
        tytul: d.title,
        opis: d.description || '',
        data_premiery: d.release_date || '',
        plakat_url: this.buduj_url(d.poster_path),
        trailer_url: d.trailer_url || '',
        bezpieczny_trailer_url: this.konwertuj_na_bezpieczny_youtube(d.trailer_url),
        ocena_srednia: d.ocena || 0,
        ocena_glosy: d.liczba_glosow || 0,
        czas_trwania: d.czas_trwania || 0,
        rok: d.release_date ? new Date(d.release_date).getFullYear() : 0,
        czy_serial: true,
      }));

      this.lista_seriale.set(wynik);
      this.ustaw_poczatkowa_wyspe(wynik);
    });
  }

  zmiana_kategorii(nowa_kategoria: string) {
    this.wybrana_kategoria.set(nowa_kategoria);
    this.odswiez_filmy();
  }

  najechano_na_kafelek(wideo: ElementWideo) {
    if (window.innerWidth <= 768) {
      return;
    }

    if (this.aktywna_wyspa()?.id === wideo.id) {
      return;
    }

    clearTimeout(this.id_timeout_hover);

    this.id_timeout_hover = setTimeout(() => {
      this.aktywna_wyspa.set(wideo);
      this.czy_gra_zwiastun.set(false);
      clearTimeout(this.id_timeout);

      this.id_timeout = setTimeout(() => {
        this.czy_gra_zwiastun.set(true);
      }, 3000);
    }, 500);
  }

  zjechano_z_kafelka() {
    if (window.innerWidth <= 768) {
      return;
    }
    clearTimeout(this.id_timeout_hover);
  }

  obsluga_scrolla(zdarzenie: Event, lista: ElementWideo[]) {
    if (window.innerWidth > 768) {
      return;
    }

    clearTimeout(this.id_timeout_scroll);

    this.id_timeout_scroll = setTimeout(() => {
      const kontener = zdarzenie.target as HTMLElement;
      const kafelki = Array.from(kontener.querySelectorAll('.kafelek')) as HTMLElement[];

      if (kafelki.length === 0) return;

      const srodek_kontenera = kontener.getBoundingClientRect().left + kontener.clientWidth / 2;

      let najmniejszy_dystans = Infinity;
      let indeks_najblizszego = -1;

      kafelki.forEach((kafelek, indeks) => {
        const prostokat = kafelek.getBoundingClientRect();
        const srodek_kafelka = prostokat.left + prostokat.width / 2;
        const dystans = Math.abs(srodek_kontenera - srodek_kafelka);

        if (dystans < najmniejszy_dystans) {
          najmniejszy_dystans = dystans;
          indeks_najblizszego = indeks;
        }
      });

      if (indeks_najblizszego !== -1 && lista[indeks_najblizszego]) {
        const wideo = lista[indeks_najblizszego];

        if (this.aktywna_wyspa()?.id !== wideo.id) {
          this.aktywna_wyspa.set(wideo);
          this.czy_gra_zwiastun.set(false);
          clearTimeout(this.id_timeout);

          this.id_timeout = setTimeout(() => {
            this.czy_gra_zwiastun.set(true);
          }, 3000);
        }
      }
    }, 150);
  }

  przejdz_do_odtwarzacza(wideo: ElementWideo, zdarzenie?: Event) {
    if (zdarzenie) zdarzenie.stopPropagation();
    if (wideo && wideo.id) {
      const parametry: any = { id: wideo.id, czy_serial: wideo.czy_serial ? 'true' : 'false' };

      if (wideo.odcinek_id) {
        parametry.odcinek_id = wideo.odcinek_id;
      }

      this.router.navigate(['/play'], { queryParams: parametry });
    }
  }

  otworz_zwiastun(url: string, zdarzenie: Event) {
    if (zdarzenie) zdarzenie.stopPropagation();
    if (url) window.open(url, '_blank');
  }
}
