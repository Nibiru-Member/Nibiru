import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class unAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isLogin()) {
      // User NOT logged in, allow access to route (e.g., login page)
      return true;
    } else {
      // User is logged in, redirect to dashboard
      this.router.navigate(['/dashboard/admin']);
      return false;
    }
  }
}
