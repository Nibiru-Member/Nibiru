import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-policy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-policy.component.html',
})
export class FilterPolicyComponent {
  @Input() pageCountMin = 0;
  @Input() pageCountMax = 0;

  // default REAL value
  @Input() primaryIndexSorting = 'Fragmentation, Descending Order';

  @Output() pageCountMinChange = new EventEmitter<number>();
  @Output() pageCountMaxChange = new EventEmitter<number>();
  @Output() primaryIndexSortingChange = new EventEmitter<string>();

  onPageCountMinChange(e: any) {
    this.pageCountMinChange.emit(Number(e.target.value));
  }
  onPageCountMaxChange(e: any) {
    this.pageCountMaxChange.emit(Number(e.target.value));
  }
  onPrimaryIndexSortingChange(e: any) {
    this.primaryIndexSortingChange.emit(e.target.value);
  }

  validate(): boolean {
    const min = Number(this.pageCountMin);
    const max = Number(this.pageCountMax);

    if (isNaN(min) || isNaN(max)) return false;
    if (min < 0) return false;
    if (min > max) return false;

    if (!this.primaryIndexSorting) return false;

    return true;
  }

  getFormData() {
    return {
      pageCountMin: this.pageCountMin,
      pageCountMax: this.pageCountMax,
      primaryIndexSorting: this.primaryIndexSorting,
    };
  }
}
