import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth/auth.service';

@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[hasClaim]',
})
export class HasClaimDirective {
  @Input() set hasClaim(claimType: any) {
    let data = this.authService.getUserDetail();
    if (data?.roleName == 'SuperAdmin') {
    } else {
    }
    if (this.authService.hasClaim(claimType)) {
      // Add template to DOM
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      // Remove template from DOM
      this.viewContainer.clear();
    }
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService,
  ) {}
}
