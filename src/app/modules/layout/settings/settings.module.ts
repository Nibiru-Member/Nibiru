import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsRoutingModule } from './settings-routing.module';
import { LicensingComponent } from './licensing/licensing.component';

@NgModule({
  imports: [CommonModule, SettingsRoutingModule, LicensingComponent],
})
export class SettingsModule {}


