import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-schedule-policy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-policy.component.html',
  styleUrls: ['./schedule-policy.component.css'],
})
export class SchedulePolicyComponent {
  @Input() isSchedule: boolean = false;
  @Input() scheduleType: string = '';
  @Input() startTime: string = '';
  @Input() selectedDays: boolean[] = [false, false, false, false, false, false, false];
  @Input() restrictionStart: string = '';
  @Input() restrictionEnd: string = '';

  @Output() isScheduleChange = new EventEmitter<boolean>();
  @Output() scheduleTypeChange = new EventEmitter<string>();
  @Output() startTimeChange = new EventEmitter<string>();
  @Output() selectedDaysChange = new EventEmitter<boolean[]>();
  @Output() restrictionStartChange = new EventEmitter<string>();
  @Output() restrictionEndChange = new EventEmitter<string>();

  days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  onScheduleTypeChange(event: any) {
    this.scheduleTypeChange.emit(event.target.value);
  }
  onStartTimeChange(event: any) {
    this.startTimeChange.emit(event.target.value);
  }
  onSelectedDaysChange(index: number, event: any) {
    const updated = [...this.selectedDays];
    updated[index] = event.target.checked;
    this.selectedDaysChange.emit(updated);
  }
  onRestrictionStartChange(event: any) {
    this.restrictionStartChange.emit(event.target.value);
  }
  onRestrictionEndChange(event: any) {
    this.restrictionEndChange.emit(event.target.value);
  }

  validate(): boolean {
    if (!this.isSchedule) return true; // If disabled, no validation needed
    if (!this.scheduleType) return false;
    if (!this.startTime || this.startTime.trim() === '') return false;

    if (this.scheduleType.toLowerCase() === 'weekly') {
      if (this.selectedDays.every((d) => !d)) return false;
    }

    if (this.restrictionStart && this.restrictionEnd) {
      if (this.restrictionStart === this.restrictionEnd) return false;
    }
    return true;
  }

  getFormData() {
    return {
      scheduleType: this.scheduleType,
      startTime: this.startTime,
      selectedDays: this.selectedDays,
      restrictionStart: this.restrictionStart,
      restrictionEnd: this.restrictionEnd,
      isSchedule: this.isSchedule,
    };
  }
}
