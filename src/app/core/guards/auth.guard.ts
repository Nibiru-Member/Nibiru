import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  CanLoad,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Route,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { ToasterService } from '../services/toaster/toaster.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(private router: Router, private authService: AuthService, private toastr: ToasterService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (this.authService.isLogin()) {
      let claimType: string = route.data['claimType'];
      if (claimType) {
        if (!this.authService.hasClaim(claimType)) {
          this.toastr.error(`You don't have right to access this page`);
          this.router.navigate(['/admin/profile']);
          return false;
        }
      }
    }

    this.toastr.error('You must be signed in to access this page');
    this.router.navigate(['/auth/sign-in'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(childRoute, state);
  }

  canLoad(route: Route): boolean {
    if (this.authService.isLogin()) {
      return true;
    }

    this.toastr.error('You must be signed in to load this module');
    this.router.navigate(['/auth/sign-in']);
    return false;
  }
}
