import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly slides = [
    {
      title: 'Atención integral',
      subtitle: 'Hospital privado con enfoque humano y excelencia clínica.',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80',
    },
    {
      title: 'Tecnología y confort',
      subtitle: 'Instalaciones modernas para su tranquilidad y la de su familia.',
      image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1400&q=80',
    },
    {
      title: 'Equipo especializado',
      subtitle: 'Personal médico y administrativo altamente capacitado.',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1400&q=80',
    },
  ];
  active = 0;

  prev(): void {
    this.active = (this.active - 1 + this.slides.length) % this.slides.length;
  }

  next(): void {
    this.active = (this.active + 1) % this.slides.length;
  }
}
