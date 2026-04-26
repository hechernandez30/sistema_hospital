import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class ServicesComponent {
  readonly services = [
    {
      icon: 'calendar_month',
      title: 'Agenda y consulta externa',
      subtitle: 'Citas programadas',
      description: 'Coordinación de citas con especialistas y seguimiento oportuno.',
    },
    {
      icon: 'local_hospital',
      title: 'Urgencias y admisión',
      subtitle: 'Atención priorizada',
      description: 'Valoración inicial, triage y admisión según protocolos institucionales.',
    },
    {
      icon: 'biotech',
      title: 'Apoyo diagnóstico',
      subtitle: 'Laboratorio e imágenes',
      description: 'Estudios con trazabilidad y resultados integrados al expediente.',
    },
    {
      icon: 'payments',
      title: 'Gestión financiera',
      subtitle: 'Seguros y pagos',
      description: 'Asesoría en coberturas y opciones de pago en sitio.',
    },
  ];
}
