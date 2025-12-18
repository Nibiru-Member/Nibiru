import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth/auth.service';

@Component({
  selector: 'app-redirect',
  template: '', // No UI needed
})
export class RedirectComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.authService.isLogin()) {
      this.router.navigate(['/dashboard/admin']);
    } else {
      this.router.navigate(['/auth/sign-in']);
    }
  }
}
