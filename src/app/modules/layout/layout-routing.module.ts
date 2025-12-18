import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { RedirectComponent } from 'src/app/shared/components/redirect/redirect.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
        canLoad: [AuthGuard], // ✅ Guarded
      },
      {
        path: 'master',
        loadChildren: () => import('../master/master.module').then((m) => m.MasterModule),
        canLoad: [AuthGuard],
      },
      {
        path: 'policy',
        loadChildren: () => import('../layout/policy/policy.module').then((m) => m.PolicyModule),
        canLoad: [AuthGuard],
      },
      {
        path: 'account',
        loadChildren: () => import('../layout/account/acount.module').then((m) => m.AccountModule),
        canLoad: [AuthGuard],
      },
      {
        path: 'components',
        loadChildren: () => import('../uikit/uikit.module').then((m) => m.UikitModule),
        canLoad: [AuthGuard], // ✅ Guarded
      },
      {
        path: '',
        component: RedirectComponent, // ✅ Handles login redirect
      },
      { path: '**', redirectTo: 'errors/404' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LayoutRoutingModule {}
