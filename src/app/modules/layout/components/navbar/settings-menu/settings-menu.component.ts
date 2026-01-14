import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, inject, OnInit } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ClickOutsideDirective } from '../../../../../shared/directives/click-outside.directive';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings-menu',
  templateUrl: './settings-menu.component.html',
  styleUrls: ['./settings-menu.component.css'],
  imports: [ClickOutsideDirective, AngularSvgIconModule],
  animations: [
    trigger('openClose', [
      state(
        'open',
        style({
          opacity: 1,
          transform: 'translateY(0)',
          visibility: 'visible',
        }),
      ),
      state(
        'closed',
        style({
          opacity: 0,
          transform: 'translateY(-20px)',
          visibility: 'hidden',
        }),
      ),
      transition('open => closed', [animate('0.2s')]),
      transition('closed => open', [animate('0.2s')]),
    ]),
  ],
})
export class SettingsMenuComponent implements OnInit {
  public isOpen = false;

  public settingsMenu = [
    {
      title: 'Accounts',
      icon: './assets/icons/heroicons/outline/user.svg',
      action: () => this.navigateToAccounts(),
    },
    {
      title: 'Roles',
      icon: './assets/icons/heroicons/outline/user-circle.svg',
      action: () => this.navigateToRoles(),
    },
    {
      title: 'Licensing',
      icon: './assets/icons/heroicons/outline/key.svg',
      action: () => this.navigateToLicensing(),
    },
  ];

  private router = inject(Router);

  constructor() {}

  ngOnInit(): void {}

  public toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  navigateToAccounts() {
    this.isOpen = false;
    this.router.navigate(['/account/account-list']);
  }

  navigateToRoles() {
    this.isOpen = false;
    this.router.navigate(['/master/role']);
  }

  navigateToLicensing() {
    this.isOpen = false;
    // Placeholder for actual licensing route
    // this.router.navigate(['/settings/licensing']);
  }
}

