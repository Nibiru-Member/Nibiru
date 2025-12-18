import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PolicyComponent } from './policy.component';
import { PolicyListComponent } from './policy-list/policy-list.component';

const routes: Routes = [
  {
    path: '',
    component: PolicyComponent,
    children: [
      { path: '', redirectTo: 'role', pathMatch: 'full' },
      { path: 'policy-list', component: PolicyListComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PolicyRoutingModule {}
