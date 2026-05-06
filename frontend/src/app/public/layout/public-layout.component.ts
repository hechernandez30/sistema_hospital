import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { Observable, of } from 'rxjs';
import { PublicContentService } from '../services/public-content.service';
import { PublicSearchResult } from '../models/public-content.models';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCardModule,
    FormsModule,
    AsyncPipe,
  ],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent {
  private readonly content = inject(PublicContentService);
  private readonly router = inject(Router);
  private readonly el = inject(ElementRef<HTMLElement>);

  readonly year = new Date().getFullYear();

  q = '';
  open = false;
  searching = false;
  results$: Observable<PublicSearchResult[]> = of([]);

  runSearch(): void {
    const query = this.q.trim();
    this.open = !!query;
    if (!query) {
      this.results$ = of([]);
      return;
    }
    this.searching = true;
    this.results$ = this.content.search(query);
    this.results$.subscribe({ next: () => (this.searching = false), error: () => (this.searching = false) });
  }

  clear(): void {
    this.q = '';
    this.results$ = of([]);
    this.open = false;
    this.searching = false;
  }

  pick(r: PublicSearchResult): void {
    void this.router.navigateByUrl(r.fragment ? `${r.route}#${r.fragment}` : r.route);
    this.clear();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent): void {
    const target = ev.target as Node | null;
    if (!target) {
      return;
    }
    if (this.el.nativeElement.contains(target)) {
      return;
    }
    this.open = false;
  }
}
