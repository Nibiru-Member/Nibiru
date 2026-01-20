import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notification-policy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-policy.component.html',
})
export class NotificationPolicyComponent implements OnInit {
  @Input() notificationsPolicy: any = null;
  @Input() emailAlerts = '';
  
  isEmailValid = true;
  @Output() emailAlertsChange = new EventEmitter<string>();

  notificationOptions = [
    { name: 'Policy Started', value: 'Started' },
    { name: 'Policy Completed', value: 'Completed' },
    { name: 'Policy Canceled', value: 'Canceled' },
    { name: 'Policy Expired', value: 'Expired' },
    { name: 'Policy Disabled', value: 'Disabled' },
    { name: 'Policy Failed', value: 'Failed' },
    { name: 'Policy Delayed', value: 'Delayed' },
  ];

  selectedNotifications: string[] = [];
  @Output() selectedNotificationsChange = new EventEmitter<string[]>();

  enableCustomEmail = false;

  ngOnInit(): void {
    if (this.notificationsPolicy) {
      console.log('notificationsPolicy', this.notificationsPolicy);
      // Initialize from notificationsPolicy
      if (Array.isArray(this.notificationsPolicy.selectedNotifications)) {
        this.selectedNotifications = [...this.notificationsPolicy.selectedNotifications];
      }
      this.emailAlerts = this.notificationsPolicy.emailAlerts ?? this.emailAlerts ?? '';
      this.enableCustomEmail = this.notificationsPolicy.enableCustomEmail ?? this.enableCustomEmail ?? false;
    }
  }

  toggleNotification(value: string) {
    if (this.selectedNotifications.includes(value)) {
      this.selectedNotifications = this.selectedNotifications.filter((n) => n !== value);
    } else {
      this.selectedNotifications.push(value);
    }
    this.selectedNotificationsChange.emit(this.selectedNotifications);
  }

  onToggleCustomEmail() {
    if (!this.enableCustomEmail) {
      this.emailAlerts = '';
      this.emailAlertsChange.emit('');
    }
  }

  validateEmails(emails: string): boolean {
    if (!emails) return false;

    const emailList = emails
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailList.every((email) => emailRegex.test(email));
  }

  onEmailChange(e: any) {
    const value = e.target.value;
    this.isEmailValid = this.validateEmails(value);
    this.emailAlertsChange.emit(value);
  }

  validate(): boolean {
    if (this.selectedNotifications && this.selectedNotifications.length > 0) {
      return true;
    }

    if (this.enableCustomEmail && this.emailAlerts) {
      return this.validateEmails(this.emailAlerts);
    }

    return false;
  }

  getFormData() {
    return {
      selectedNotifications: this.selectedNotifications,
      emailAlerts: this.enableCustomEmail ? this.emailAlerts : '',
      enableCustomEmail: this.enableCustomEmail,
    };
  }
}
