import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, inject, OnInit } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ClickOutsideDirective } from '../../../../../shared/directives/click-outside.directive';
import { AuthResponse } from 'src/app/core/models/auth.model';
import { Router } from '@angular/router';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { catchError, EMPTY, take } from 'rxjs';
import { UserService } from 'src/app/core/services/user/user.service';
import { ServerStateService } from 'src/app/core/services/server-state.service';

@Component({
  selector: 'app-profile-menu',
  templateUrl: './profile-menu.component.html',
  styleUrls: ['./profile-menu.component.css'],
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
export class ProfileMenuComponent implements OnInit {
  public isOpen = false;
  userData!: AuthResponse;

  public profileMenu = [
    {
      title: 'User Profile',
      icon: './assets/icons/heroicons/outline/user-circle.svg',
      action: () => this.profile(),
    },
    {
      title: 'Manage Accounts',
      icon: './assets/icons/heroicons/outline/cog-6-tooth.svg',
      action: () => this.allAcounts(),
    },
    {
      title: 'Upgrade Accounts',
      icon: './assets/icons/heroicons/outline/view-grid.svg',
      action: () => this.upgradeAcount(),
    },
    {
      title: 'Log out',
      icon: './assets/icons/heroicons/outline/logout.svg',
      action: () => this.logout(),
    },
  ];

  private router = inject(Router);
  private _toast = inject(ToasterService);
  private _userService = inject(UserService);
  profilePicture: any;
  private serverState = inject(ServerStateService);
  constructor() {}

  ngOnInit(): void {
    const encryptData = localStorage.getItem('authObj');
    if (encryptData) this.userData = JSON.parse(encryptData);
    this.profilePicture = this.userData.userProfilePic;
  }

  public toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  logout() {
    const payload = {
      userId: this.userData.userId,
      sessionId: this.userData.activeSessionId,
    };
    this._userService
      .logout(payload)
      .pipe(
        catchError((error) => {
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res?.statusCode < 400) {
          localStorage.clear();
          this.serverState.clearConnection();
          this._toast.success(res?.message);
          this.router.navigate(['/auth/sign-in']);
        } else {
          this._toast.error(res?.message);
        }
      });
  }

  profile() {
    this.router.navigate(['/dashboard/my-profile']);
  }

  allAcounts() {
    this.router.navigate(['/dashboard/manage-accounts']);
  }

  upgradeAcount() {
    // this.router.navigate(['/dashboard/my-profile']);
  }
}
