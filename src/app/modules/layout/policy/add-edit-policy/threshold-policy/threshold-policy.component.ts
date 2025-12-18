import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-threshold-policy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './threshold-policy.component.html',
})
export class ThresholdPolicyComponent {
  @Input() fragmentation = { enabled: true, value: 30, recommended: 30 };
  @Input() scanDensity = { enabled: false, value: 80, recommended: 80 };

  @Output() fragmentationChange = new EventEmitter<typeof this.fragmentation>();
  @Output() scanDensityChange = new EventEmitter<typeof this.scanDensity>();

  onFragmentationChange() {
    this.fragmentationChange.emit(this.fragmentation);
  }

  onScanDensityChange() {
    this.scanDensityChange.emit(this.scanDensity);
  }

  // Validate the threshold tab
  validate(): boolean {
    // If fragmentation enabled: value must be 0..100
    if (this.fragmentation?.enabled) {
      const v = Number(this.fragmentation.value);
      if (isNaN(v) || v < 0 || v > 100) return false;
    }
    // If scandensity enabled: value must be 0..100
    if (this.scanDensity?.enabled) {
      const v = Number(this.scanDensity.value);
      if (isNaN(v) || v < 0 || v > 100) return false;
    }
    return true;
  }

  getFormData() {
    return {
      fragmentation: this.fragmentation,
      scanDensity: this.scanDensity,
    };
  }
}
