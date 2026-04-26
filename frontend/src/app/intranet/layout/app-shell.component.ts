import { Component, inject, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { MenuService } from '../../core/services/menu.service';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);
  private readonly menu = inject(MenuService);
  private readonly breakpoint = inject(BreakpointObserver);

  readonly sidenav = viewChild.required<MatSidenav>('sidenav');

  readonly userName = this.auth.getUsername() ?? 'Usuario';
  /** Texto de roles solo para presentación en cabecera (misma fuente que el JWT). */
  readonly rolesLine = AppShellComponent.formatRoleLine(this.auth.getRoles());
  readonly menuItems = this.menu.visibleMenuItems();

  readonly isHandset = toSignal(
    this.breakpoint.observe('(max-width: 960px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  logout(): void {
    this.auth.logout();
  }

  closeNavIfMobile(): void {
    if (this.isHandset()) {
      this.sidenav().close();
    }
  }

  private static formatRoleLine(roles: string[]): string {
    if (!roles.length) {
      return '';
    }
    return roles.map((r) => r.replace(/^ROLE_/, '').replace(/_/g, ' ')).join(' · ');
  }
}
