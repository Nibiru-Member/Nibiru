import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleComponent } from './role/role.component';
import { ModuleComponent } from './module/module.component';
import { LookupComponent } from './lookup/lookup.component';
import { MasterComponent } from './master.component';
import { RolePermissionComponent } from './role/role-permission/role-permission.component';
import { ModulePermissionComponent } from './module/module-permission/module-permission.component';

const routes: Routes = [
  {
    path: '',
    component: MasterComponent,
    children: [
      { path: '', redirectTo: 'role', pathMatch: 'full' },
      { path: 'role', component: RoleComponent },
      { path: 'role-permission/:id', component: RolePermissionComponent },
      { path: 'module', component: ModuleComponent },
      { path: 'module-permission/:id', component: ModulePermissionComponent },
      { path: 'lookup', component: LookupComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MasterRoutingModule {}
