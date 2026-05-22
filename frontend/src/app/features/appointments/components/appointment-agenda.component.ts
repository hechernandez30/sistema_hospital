import { DatePipe, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppointmentView } from '../models/appointment.models';
import { appointmentStatusChipClass } from '../appointment-status-chip';
import {
  AgendaDoctorColumn,
  AgendaLayoutBlock,
  AgendaRangeMode,
  AgendaTimeSlot,
  MonthCalendarCell,
  WeekDayColumn,
  addDays,
  addMonths,
  addWeeks,
  buildAgendaTimeSlots,
  buildDoctorColumns,
  buildMonthCalendar,
  buildWeekDayColumns,
  formatAgendaTimeRange,
  layoutBlocksForDay,
  patientCodeFromLabel,
  rangeTitle,
  startOfDay,
} from '../appointment-page.utils';
import { StaffResponse } from '../../staff/models/staff.models';

@Component({
  selector: 'app-appointment-agenda',
  standalone: true,
  imports: [NgClass, DatePipe, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './appointment-agenda.component.html',
  styleUrl: './appointment-agenda.component.scss',
})
export class AppointmentAgendaComponent {
  @Input() appointments: AppointmentView[] = [];
  @Input() staff: StaffResponse[] = [];
  @Input() doctorLabels = new Map<number, string>();
  @Input() rangeMode: AgendaRangeMode = 'day';
  @Input() anchorDate = startOfDay(new Date());
  @Input() filterDoctorId: number | null = null;
  @Input() filterSpecialtyId: number | null = null;

  @Output() appointmentClick = new EventEmitter<AppointmentView>();
  @Output() emptySlotClick = new EventEmitter<{ doctorId: number | null; day: Date; minutesFromMidnight: number }>();
  @Output() anchorDateChange = new EventEmitter<Date>();
  @Output() daySelected = new EventEmitter<Date>();

  readonly timeSlots: AgendaTimeSlot[] = buildAgendaTimeSlots();
  readonly monthWeekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly formatAgendaTimeRange = formatAgendaTimeRange;

  statusChipClass(status: string): string {
    return appointmentStatusChipClass(status);
  }

  get rangeLabel(): string {
    return rangeTitle(this.anchorDate, this.rangeMode);
  }

  get doctorColumns(): AgendaDoctorColumn[] {
    return buildDoctorColumns(this.staff, this.doctorLabels, this.filterDoctorId, this.filterSpecialtyId);
  }

  get weekColumns(): WeekDayColumn[] {
    return buildWeekDayColumns(this.anchorDate);
  }

  get monthCells(): MonthCalendarCell[] {
    return buildMonthCalendar(this.anchorDate, this.appointments);
  }

  blocksForDoctorDay(doctorId: number, day: Date): AgendaLayoutBlock[] {
    const rows = this.appointments.filter((a) => a.doctorId === doctorId);
    return layoutBlocksForDay(rows, day);
  }

  blocksForWeekDay(day: Date): AgendaLayoutBlock[] {
    const docId = this.filterDoctorId;
    const rows = docId != null ? this.appointments.filter((a) => a.doctorId === docId) : this.appointments;
    return layoutBlocksForDay(rows, day);
  }

  onBlockClick(apt: AppointmentView, event: Event): void {
    event.stopPropagation();
    this.appointmentClick.emit(apt);
  }

  onDayColumnClick(day: Date, event: MouseEvent): void {
    const col = event.currentTarget as HTMLElement;
    const rect = col.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, y / rect.height));
    const totalSlots = this.timeSlots.length;
    const slotIndex = Math.min(totalSlots - 1, Math.floor(ratio * totalSlots));
    const minutes = this.timeSlots[slotIndex]?.minutesFromMidnight ?? 7 * 60;
    this.emptySlotClick.emit({
      doctorId: this.filterDoctorId,
      day,
      minutesFromMidnight: minutes,
    });
  }

  onDoctorColumnClick(doctorId: number, event: MouseEvent): void {
    const col = event.currentTarget as HTMLElement;
    const rect = col.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, y / rect.height));
    const totalSlots = this.timeSlots.length;
    const slotIndex = Math.min(totalSlots - 1, Math.floor(ratio * totalSlots));
    const minutes = this.timeSlots[slotIndex]?.minutesFromMidnight ?? 7 * 60;
    this.emptySlotClick.emit({
      doctorId,
      day: this.anchorDate,
      minutesFromMidnight: minutes,
    });
  }

  navigatePrev(): void {
    this.shiftAnchor(-1);
  }

  navigateNext(): void {
    this.shiftAnchor(1);
  }

  goToday(): void {
    this.anchorDateChange.emit(startOfDay(new Date()));
  }

  private shiftAnchor(dir: number): void {
    let next = this.anchorDate;
    if (this.rangeMode === 'week') {
      next = addWeeks(this.anchorDate, dir);
    } else if (this.rangeMode === 'month') {
      next = addMonths(this.anchorDate, dir);
    } else {
      next = addDays(this.anchorDate, dir);
    }
    this.anchorDateChange.emit(next);
  }

  blockTooltip(apt: AppointmentView): string {
    const code = patientCodeFromLabel(apt.patientLabel);
    const codePart = code ? ` · ${code}` : '';
    return `${apt.patientLabel}${codePart}\n${formatAgendaTimeRange(apt)}\n${apt.status}`;
  }

  monthCellLabel(cell: MonthCalendarCell): string {
    return String(cell.date.getDate());
  }

  onMonthDayClick(cell: MonthCalendarCell): void {
    if (!cell.inMonth) {
      return;
    }
    this.daySelected.emit(startOfDay(cell.date));
  }

  trackApt(_: number, apt: AppointmentView): number {
    return apt.id;
  }

  trackDoctor(_: number, d: AgendaDoctorColumn): number {
    return d.id;
  }

  trackDay(_: number, d: WeekDayColumn): number {
    return d.date.getTime();
  }

  trackCell(_: number, c: MonthCalendarCell): number {
    return c.date.getTime();
  }
}
