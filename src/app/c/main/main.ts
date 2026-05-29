import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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

  aktywna_wyspa = signal<ElementWideo | null>(null);
  czy_gra_zwiastun = signal<boolean>(false);

  lista_ostatnio = signal<ElementWideo[]>([]);
  lista_filmy = signal<ElementWideo[]>([]);
  lista_seriale = signal<ElementWideo[]>([]);

  lista_kategorii = signal<Kategoria[]>([]);
  wybrana_kategoria = signal<string>('');

  id_timeout: ReturnType<typeof setTimeout> | undefined;

  url_bazowy = 'http://127.0.0.1:8000';

  ngOnInit() {
    this.laduj_kategorie();
    this.odswiez_ostatnio();
    this.odswiez_seriale();
  }

  ngOnDestroy() {
    clearTimeout(this.id_timeout);
  }

  buduj_url(sciezka: string | null | undefined): string {
    if (!sciezka) return '';
    if (sciezka.startsWith('http')) return sciezka;
    return `${this.url_bazowy}/${sciezka}`;
  }

  laduj_kategorie() {
    this.http.get<string[]>(`${this.url_bazowy}/wideo/kategoria_list`).subscribe((dane) => {
      const mapowane_kategorie = dane.map((k) => ({ id: k, nazwa: k }));
      this.lista_kategorii.set(mapowane_kategorie);

      if (mapowane_kategorie.length > 0) {
        this.wybrana_kategoria.set(mapowane_kategorie[0].id);
        this.odswiez_filmy();
      }
    });
  }

  odswiez_ostatnio() {
    this.http.get<OstatnioDto[]>(`${this.url_bazowy}/wideo/ostatnio_ogladane`).subscribe((dane) => {
      const wynik = dane.map((d) => ({
        id: d.media_id,
        tytul: d.tytul,
        opis: '',
        plakat_url: this.buduj_url(d.plakat_url),
        trailer_url: '',
        ocena: 0,
        rok: 0,
        czy_serial: d.typ_media === 'serial',
      }));
      this.lista_ostatnio.set(wynik);

      if (wynik.length > 0 && !this.aktywna_wyspa()) {
        this.aktywna_wyspa.set(wynik[0]);
      }
    });
  }

  odswiez_filmy() {
    const kategoria = this.wybrana_kategoria();
    let url_endpoint = `${this.url_bazowy}/wideo/filmy_list?limit=10`;

    if (kategoria) {
      url_endpoint += `&kategoria=${kategoria}`;
    }

    this.http.get<FilmDto[]>(url_endpoint).subscribe((dane) => {
      const wynik = dane.map((d) => {
        const rok_wydania = d.release_date ? new Date(d.release_date).getFullYear() : 0;
        return {
          id: d.id,
          tytul: d.title,
          opis: d.description || '',
          plakat_url: this.buduj_url(d.poster_path),
          trailer_url: this.buduj_url(d.trailer_url),
          ocena: 0,
          rok: rok_wydania,
          kategoria: d.genres.length > 0 ? d.genres[0] : '',
          czy_serial: false,
        };
      });
      this.lista_filmy.set(wynik);
    });
  }

  odswiez_seriale() {
    this.http
      .get<SerialDto[]>(`${this.url_bazowy}/wideo/seriale_list?limit=7`)
      .subscribe((dane) => {
        const wynik = dane.map((d) => ({
          id: d.id,
          tytul: d.title,
          opis: d.description || '',
          plakat_url: this.buduj_url(d.poster_path),
          trailer_url: '',
          ocena: 0,
          rok: 0,
          kategoria: d.genres.length > 0 ? d.genres[0] : '',
          czy_serial: true,
        }));
        this.lista_seriale.set(wynik);
      });
  }

  zmiana_kategorii(nowa_kategoria: string) {
    this.wybrana_kategoria.set(nowa_kategoria);
    this.odswiez_filmy();
  }

  najechano_na_kafelek(wideo: ElementWideo) {
    if (this.aktywna_wyspa()?.id === wideo.id) {
      return;
    }

    this.aktywna_wyspa.set(wideo);
    this.czy_gra_zwiastun.set(false);
    clearTimeout(this.id_timeout);

    this.id_timeout = setTimeout(() => {
      this.czy_gra_zwiastun.set(true);
    }, 3000);
  }

  zjechano_z_kafelka() {
    clearTimeout(this.id_timeout);
  }

  przejdz_do_odtwarzacza(wideo: ElementWideo) {
    this.router.navigate(['/play'], {
      queryParams: { id: wideo.id, czy_serial: wideo.czy_serial },
    });
  }
}
