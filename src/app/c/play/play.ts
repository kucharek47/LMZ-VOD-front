import {
  Component,
  signal,
  HostListener,
  ViewChild,
  ElementRef,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './play.html',
  styleUrl: './play.scss',
})
export class PlayComponent implements OnInit, OnDestroy {
  router = inject(Router);
  route = inject(ActivatedRoute);
  http = inject(HttpClient);

  @ViewChild('wideo_el') wideo_el!: ElementRef<HTMLVideoElement>;

  id_media = signal<number>(0);
  id_odcinka = signal<number | null>(null);

  czy_pokazac_pasek = signal<boolean>(true);
  czy_kursor_na_pasku = signal<boolean>(false);
  czy_odtwarza = signal<boolean>(false);
  szybkosc_odtwarzania = signal<number>(1);
  postep_procent = signal<number>(0);
  czy_pokazac_pomin_intro = signal<boolean>(false);

  czy_pokazac_wznowienie = signal<boolean>(false);
  zapisany_czas = signal<number>(0);

  id_timeout: ReturnType<typeof setTimeout> | undefined;
  interwal_ping: ReturnType<typeof setInterval> | undefined;
  interwal_zapis: ReturnType<typeof setInterval> | undefined;
  wideo_url = signal<string>('');

  ngOnInit() {
    this.resetuj_ukrywanie();

    this.route.queryParams.subscribe((params) => {
      const id = Number(params['id']);
      const czy_serial = params['czy_serial'] === 'true';
      const odcinek_id = params['odcinek_id'] ? Number(params['odcinek_id']) : null;

      if (id) {
        this.id_media.set(id);
        this.id_odcinka.set(odcinek_id);

        const id_do_streamu = czy_serial && odcinek_id ? odcinek_id : id;
        this.wideo_url.set(`/wideo/stream/${id_do_streamu}?czy_serial=${czy_serial}`);

        this.sprawdz_zapisany_czas(id, odcinek_id);
      }
    });

    this.interwal_ping = setInterval(
      () => {
        this.http.get('/user/check').subscribe({ error: () => {} });
      },
      15 * 60 * 1000,
    );

    this.interwal_zapis = setInterval(() => {
      this.zapisz_postep();
    }, 5000);
  }

  ngOnDestroy() {
    clearTimeout(this.id_timeout);
    clearInterval(this.interwal_ping);
    clearInterval(this.interwal_zapis);
  }

  sprawdz_zapisany_czas(media_id: number, odcinek_id: number | null) {
    let url = `/progress/time/${media_id}`;
    if (odcinek_id) {
      url += `?odcinek_id=${odcinek_id}`;
    }

    this.http.get<{ obejrzany_czas: number }>(url).subscribe((res) => {
      if (res.obejrzany_czas > 0) {
        this.zapisany_czas.set(res.obejrzany_czas);
        this.czy_pokazac_wznowienie.set(true);
      } else {
        this.rozpocznij_odtwarzanie();
      }
    });
  }

  zapisz_postep(wymus: boolean = false) {
    if (!this.wideo_el || !this.wideo_el.nativeElement) return;
    const wideo = this.wideo_el.nativeElement;

    if (wideo.duration > 0 && (!wideo.paused || wymus)) {
      const dane = {
        media_id: this.id_media(),
        odcinek_id: this.id_odcinka(),
        aktualny_czas: wideo.currentTime,
        calkowity_czas: wideo.duration
      };
      this.http.post('/progress/update', dane).subscribe();
    }
  }


  wznow_ogladanie() {
    this.czy_pokazac_wznowienie.set(false);
    const wideo = this.wideo_el.nativeElement;
    wideo.currentTime = this.zapisany_czas();
    this.rozpocznij_odtwarzanie();
  }

  zacznij_od_nowa() {
    this.czy_pokazac_wznowienie.set(false);
    const wideo = this.wideo_el.nativeElement;
    wideo.currentTime = 0;
    this.rozpocznij_odtwarzanie();
  }

  rozpocznij_odtwarzanie() {
    const wideo = this.wideo_el.nativeElement;
    wideo
      .play()
      .then(() => this.czy_odtwarza.set(true))
      .catch(() => {});
  }

  formatuj_czas(sekundy: number): string {
    const h = Math.floor(sekundy / 3600);
    const m = Math.floor((sekundy % 3600) / 60);
    const s = Math.floor(sekundy % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  @HostListener('document:mousemove')
  ruch_myszka() {
    this.czy_pokazac_pasek.set(true);
    this.resetuj_ukrywanie();
  }
  @HostListener('window:beforeunload')
  przed_wyjsciem() {
    this.zapisz_postep(true);
  }

  najechano_na_pasek() {
    this.czy_kursor_na_pasku.set(true);
    clearTimeout(this.id_timeout);
  }

  zjechano_z_paska() {
    this.czy_kursor_na_pasku.set(false);
    this.resetuj_ukrywanie();
  }

  resetuj_ukrywanie() {
    clearTimeout(this.id_timeout);

    if (this.czy_kursor_na_pasku()) {
      return;
    }

    this.id_timeout = setTimeout(() => {
      this.czy_pokazac_pasek.set(false);
    }, 5000);
  }

  przelacz_odtwarzanie() {
    const wideo = this.wideo_el.nativeElement;
    if (wideo.paused) {
      wideo.play();
      this.czy_odtwarza.set(true);
    } else {
      wideo.pause();
      this.czy_odtwarza.set(false);
    }
  }

  aktualizuj_czas() {
    const wideo = this.wideo_el.nativeElement;
    const procent = wideo.duration ? (wideo.currentTime / wideo.duration) * 100 : 0;
    this.postep_procent.set(procent);

    if (wideo.currentTime > 10 && wideo.currentTime < 90) {
      this.czy_pokazac_pomin_intro.set(true);
    } else {
      this.czy_pokazac_pomin_intro.set(false);
    }
  }

  przewin_suwak(zdarzenie: Event) {
    const wideo = this.wideo_el.nativeElement;
    const element = zdarzenie.target as HTMLInputElement;
    const nowa_wartosc = parseFloat(element.value);
    if (wideo.duration) {
      wideo.currentTime = (nowa_wartosc / 100) * wideo.duration;
    }
  }

  przewin_czas(sekundy: number) {
    const wideo = this.wideo_el.nativeElement;
    wideo.currentTime += sekundy;
  }

  zmien_szybkosc() {
    const wideo = this.wideo_el.nativeElement;
    let nowa_szybkosc = this.szybkosc_odtwarzania() + 0.25;
    if (nowa_szybkosc > 2) {
      nowa_szybkosc = 0.5;
    }
    wideo.playbackRate = nowa_szybkosc;
    this.szybkosc_odtwarzania.set(nowa_szybkosc);
  }

  pomin_intro() {
    const wideo = this.wideo_el.nativeElement;
    wideo.currentTime = 90;
  }

  pelny_ekran() {
    const kontener = document.documentElement;
    if (!document.fullscreenElement) {
      kontener.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  wroc_do_menu() {
    this.zapisz_postep(true);
    this.router.navigate(['/main']);
  }
}
