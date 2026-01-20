import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-schedule-policy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-policy.component.html',
  styleUrls: ['./schedule-policy.component.css'],
})
export class SchedulePolicyComponent implements OnInit {
  @Input() schedulePolicy: any = null;

  // Sunday-first ordering must match mapping in AddEditPolicyComponent
  days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Recurrence detail fields
  isSchedule: boolean = false;
  scheduleType: string = '';
  startTime: string = '';
  selectedDays: boolean[] = [false, false, false, false, false, false, false];
  restrictionStart: string = '';
  restrictionEnd: string = '';
  monthlyDay: number = 1;
  monthlyEveryMonths: number = 1;
  weeklyInterval: number = 1;
  dailyInterval: number = 1;
  onceDate: string = '';

  ngOnInit(): void {
    if (this.schedulePolicy) {
      console.log('schedulePolicy', this.schedulePolicy);
      this.isSchedule = this.schedulePolicy.isSchedule ?? false;
      this.scheduleType = this.schedulePolicy.scheduleType ?? '';
      this.startTime = this.schedulePolicy.startTime ?? '';

      const days = this.schedulePolicy.selectedDays as boolean[] | undefined;
      if (Array.isArray(days) && days.length === 7) {
        this.selectedDays = [...days];
      }

      this.restrictionStart = this.schedulePolicy.restrictionStart ?? '';
      this.restrictionEnd = this.schedulePolicy.restrictionEnd ?? '';

      this.monthlyDay = this.schedulePolicy.monthlyDay ?? this.monthlyDay;
      this.monthlyEveryMonths = this.schedulePolicy.monthlyEveryMonths ?? this.monthlyEveryMonths;
      this.weeklyInterval = this.schedulePolicy.weeklyInterval ?? this.weeklyInterval;
      this.dailyInterval = this.schedulePolicy.dailyInterval ?? this.dailyInterval;
      this.onceDate = this.schedulePolicy.onceDate ?? this.onceDate;
    }
  }

  onStartTimeChange(event: any) {
    this.startTime = event.target.value;
  }
  onSelectedDaysChange(index: number, event: any) {
    const updated = [...this.selectedDays];
    updated[index] = event.target.checked;
    this.selectedDays = updated;
  }
  onRestrictionStartChange(event: any) {
    this.restrictionStart = event.target.value;
  }
  onRestrictionEndChange(event: any) {
    this.restrictionEnd = event.target.value;
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
      isSchedule: this.isSchedule,
      scheduleType: this.scheduleType,
      startTime: this.startTime,
      selectedDays: this.selectedDays,
      restrictionStart: this.restrictionStart,
      restrictionEnd: this.restrictionEnd,
      monthlyDay: this.monthlyDay,
      monthlyEveryMonths: this.monthlyEveryMonths,
      weeklyInterval: this.weeklyInterval,
      dailyInterval: this.dailyInterval,
      onceDate: this.onceDate,
    };
  }
}
