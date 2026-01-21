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
  nextAutoRun: string = '';

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
      
      // Calculate next auto run after initialization
      this.calculateNextAutoRun();
    }
  }

  calculateNextAutoRun(): void {
    if (!this.isSchedule || !this.scheduleType || !this.startTime) {
      this.nextAutoRun = '';
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [hours, minutes, seconds] = this.startTime.split(':').map(Number);
    const startDateTime = new Date(today);
    startDateTime.setHours(hours || 0, minutes || 0, seconds || 0, 0);

    let nextRun: Date | null = null;

    switch (this.scheduleType.toLowerCase()) {
      case 'once':
        if (this.onceDate) {
          const onceDate = new Date(this.onceDate);
          onceDate.setHours(hours || 0, minutes || 0, seconds || 0, 0);
          nextRun = onceDate;
        }
        break;

      case 'daily':
        if (this.dailyInterval >= 1) {
          // If start time has passed today, schedule for next interval day
          if (now >= startDateTime) {
            const daysToAdd = this.dailyInterval;
            nextRun = new Date(today);
            nextRun.setDate(nextRun.getDate() + daysToAdd);
            nextRun.setHours(hours || 0, minutes || 0, seconds || 0, 0);
          } else {
            // Start time hasn't passed today, use today
            nextRun = new Date(startDateTime);
          }
        }
        break;

      case 'weekly':
        if (this.weeklyInterval >= 1 && this.selectedDays.some(d => d)) {
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const todayDayOfWeek = now.getDay();
          
          // Find the next selected day
          let daysToAdd = 0;
          let found = false;
          
          // Check remaining days of current week
          for (let i = 0; i < 7; i++) {
            const checkDay = (todayDayOfWeek + i) % 7;
            if (this.selectedDays[checkDay]) {
              if (i === 0 && now < startDateTime) {
                // Today is selected and start time hasn't passed
                daysToAdd = 0;
                found = true;
                break;
              } else if (i > 0) {
                daysToAdd = i;
                found = true;
                break;
              }
            }
          }
          
          // If no day found in current week, go to next week
          if (!found) {
            for (let i = 1; i <= 7; i++) {
              const checkDay = (todayDayOfWeek + i) % 7;
              if (this.selectedDays[checkDay]) {
                daysToAdd = i;
                found = true;
                break;
              }
            }
          }
          
          if (found) {
            // Multiply by weekly interval (e.g., every 2 weeks = 14 days)
            const totalDays = daysToAdd + ((this.weeklyInterval - 1) * 7);
            nextRun = new Date(today);
            nextRun.setDate(nextRun.getDate() + totalDays);
            nextRun.setHours(hours || 0, minutes || 0, seconds || 0, 0);
          }
        }
        break;

      case 'monthly':
        if (this.monthlyDay >= 1 && this.monthlyEveryMonths >= 1) {
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          // Get the target day for current month
          const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          const targetDay = Math.min(this.monthlyDay, daysInCurrentMonth);
          
          const currentMonthTarget = new Date(currentYear, currentMonth, targetDay);
          currentMonthTarget.setHours(hours || 0, minutes || 0, seconds || 0, 0);
          
          if (now < currentMonthTarget) {
            // Target day hasn't passed this month
            nextRun = currentMonthTarget;
          } else {
            // Target day has passed, calculate for next month
            let monthsToAdd = this.monthlyEveryMonths;
            let nextMonth = currentMonth + monthsToAdd;
            let nextYear = currentYear;
            
            if (nextMonth >= 12) {
              nextYear += Math.floor(nextMonth / 12);
              nextMonth = nextMonth % 12;
            }
            
            // Get days in the target month
            const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
            const nextTargetDay = Math.min(this.monthlyDay, daysInNextMonth);
            
            nextRun = new Date(nextYear, nextMonth, nextTargetDay);
            nextRun.setHours(hours || 0, minutes || 0, seconds || 0, 0);
          }
        }
        break;
    }

    if (nextRun) {
      // Format as ISO string or custom format
      console.log('nextRun', nextRun.toISOString());
      this.nextAutoRun = nextRun.toISOString();
    } else {
      this.nextAutoRun = '';
    }
  }

  onScheduleTypeChange() {
    this.calculateNextAutoRun();
  }
  
  onStartTimeChange(event: any) {
    this.startTime = event.target.value;
    this.calculateNextAutoRun();
  }
  
  onSelectedDaysChange(index: number, event: any) {
    const updated = [...this.selectedDays];
    updated[index] = event.target.checked;
    this.selectedDays = updated;
    this.calculateNextAutoRun();
  }
  
  onMonthlyDayChange() {
    this.calculateNextAutoRun();
  }
  
  onMonthlyEveryMonthsChange() {
    this.calculateNextAutoRun();
  }
  
  onWeeklyIntervalChange() {
    this.calculateNextAutoRun();
  }
  
  onDailyIntervalChange() {
    this.calculateNextAutoRun();
  }
  
  onOnceDateChange() {
    this.calculateNextAutoRun();
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
    // Recalculate nextAutoRun before returning form data
    this.calculateNextAutoRun();
    
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
      nextAutoRun: this.nextAutoRun,
    };
  }
}
