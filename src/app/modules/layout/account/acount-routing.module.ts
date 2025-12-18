import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountDetailComponent } from './account-detail/account-detail.component';
import { AcountComponent } from './acount.component';
import { AccountListComponent } from './account-list/account-list.component';

const routes: Routes = [
  {
    path: '',
    component: AcountComponent,
    children: [
      { path: '', redirectTo: 'account', pathMatch: 'full' },
      { path: 'account-list', component: AccountListComponent },
      { path: 'account-Detail/:id', component: AccountDetailComponent },
      { path: '**', redirectTo: 'sign-in', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountRoutingModule {}
