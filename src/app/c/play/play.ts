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

  czy_pokazac_pasek = signal<boolean>(true);
  czy_kursor_na_pasku = signal<boolean>(false);
  czy_odtwarza = signal<boolean>(false);
  szybkosc_odtwarzania = signal<number>(1);
  postep_procent = signal<number>(0);
  czy_pokazac_pomin_intro = signal<boolean>(false);

  id_timeout: ReturnType<typeof setTimeout> | undefined;
  interwal_ping: ReturnType<typeof setInterval> | undefined;
  wideo_url = signal<string>('');

  ngOnInit() {
    this.resetuj_ukrywanie();

    this.route.queryParams.subscribe((params) => {
      const id = params['id'];
      const czy_serial = params['czy_serial'] === 'true';
      if (id) {
        this.wideo_url.set(`http://127.0.0.1:8000/wideo/stream/${id}?czy_serial=${czy_serial}`);
      }
    });

    this.interwal_ping = setInterval(
      () => {
        this.http.get('http://127.0.0.1:8000/user/check').subscribe({
          error: () => {},
        });
      },
      15 * 60 * 1000,
    );
  }

  ngOnDestroy() {
    clearTimeout(this.id_timeout);
    clearInterval(this.interwal_ping);
  }

  @HostListener('document:mousemove')
  ruch_myszka() {
    this.czy_pokazac_pasek.set(true);
    this.resetuj_ukrywanie();
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
    this.router.navigate(['/main']);
  }
}
