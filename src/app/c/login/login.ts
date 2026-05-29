import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface dane_z_api {
  id: number;
  path_avatar: string;
  nazwa: string;
}

export interface Konto {
  id: number | null;
  login: string;
  avatar_url: string;
  czy_puste: boolean;
}

@Component({
  selector: 'app-logowanie',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LogowanieComponent implements OnInit {
  router = inject(Router);
  http = inject(HttpClient);

  lista_kont = signal<Konto[]>([]);
  srodkowy_index = computed(() => Math.floor(this.lista_kont().length / 2));

  ngOnInit() {
    this.pobierz_uzytkownikow();
  }

  pobierz_uzytkownikow() {
    this.http.get<dane_z_api[]>('http://127.0.0.1:8000/user/all').subscribe({
      next: (odpowiedz) => {
        const pobrane_konta: Konto[] = odpowiedz.map((uzytkownik) => ({
          id: uzytkownik.id,
          login: uzytkownik.nazwa,
          avatar_url: `http://127.0.0.1:8000/${uzytkownik.path_avatar}`,
          czy_puste: false,
        }));

        const uzupelnione_konta = this.uzupelnij_konta(pobrane_konta, 7);
        this.lista_kont.set(uzupelnione_konta);
      },
      error: () => {
        // Zabezpieczenie na wypadek braku połączenia z backendem
        this.lista_kont.set(this.uzupelnij_konta([], 7));
      },
    });
  }

  uzupelnij_konta(konta: Konto[], docelowa_ilosc: number): Konto[] {
    const wynik = [...konta];
    while (wynik.length < docelowa_ilosc) {
      wynik.push({
        id: null,
        login: '',
        avatar_url: '',
        czy_puste: true,
      });
    }
    return wynik;
  }

  przesun_lewo() {
    this.lista_kont.update((lista) => {
      const ostatni = lista[lista.length - 1];
      const reszta = lista.slice(0, -1);
      return [ostatni, ...reszta];
    });
  }

  przesun_prawo() {
    this.lista_kont.update((lista) => {
      const pierwszy = lista[0];
      const reszta = lista.slice(1);
      return [...reszta, pierwszy];
    });
  }

  wybierz_konto(index: number, konto: Konto) {
    const srodek = this.srodkowy_index();

    if (index === srodek && !konto.czy_puste) {
      this.zaloguj(konto);
    } else {
      const roznica = index - srodek;
      if (roznica > 0) {
        for (let i = 0; i < roznica; i++) {
          this.przesun_prawo();
        }
      } else if (roznica < 0) {
        for (let i = 0; i < Math.abs(roznica); i++) {
          this.przesun_lewo();
        }
      }
    }
  }

  oblicz_odleglosc(index: number): number {
    return Math.abs(index - this.srodkowy_index());
  }

  zaloguj(konto: Konto) {
    this.http
      .post('http://127.0.0.1:8000/user/login', { login: konto.login, haslo: '' })
      .subscribe({
        next: () => {
          this.router.navigate(['/main']);
        },
        error: (err) => {
          console.error('Błąd logowania:', err);
        },
      });
  }
}
