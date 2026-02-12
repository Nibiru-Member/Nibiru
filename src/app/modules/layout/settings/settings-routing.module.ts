import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LicensingComponent } from './licensing/licensing.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'licensing',
    pathMatch: 'full',
  },
  {
    path: 'licensing',
    component: LicensingComponent,
  },
  {
    path: '**',
    redirectTo: 'licensing',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}


