import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { NftComponent } from './pages/nft/nft.component';
import { ProfilePageComponent } from '../layout/components/navbar/profile-menu/profile-page/profile-page.component';
import { ManageAccountsComponent } from '../layout/components/navbar/profile-menu/manage-accounts/manage-accounts.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      { path: '', redirectTo: 'admin', pathMatch: 'full' },
      { path: 'admin', component: NftComponent },
      { path: 'my-profile', component: ProfilePageComponent },
      { path: 'manage-accounts', component: ManageAccountsComponent },
      { path: '**', redirectTo: 'errors/404' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
