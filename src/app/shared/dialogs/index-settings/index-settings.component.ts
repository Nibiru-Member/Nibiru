import { Component, inject, Inject, ViewEncapsulation, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgxSliderModule, Options, LabelType, TranslateFunction } from '@angular-slider/ngx-slider';

export interface IndexSettingsData {
  // Filters
  objectReorgSizeMin: number;
  objectReorgSizeMax: number;
  objectReorgSizeCurrent: number;
  objectRebuildSizeMin: number;
  objectRebuildSizeMax: number;
  objectRebuildSizeCurrent: number;
  
  ignoreThreshold: number;
  reorganizeThreshold: number;
  rebuildThreshold: number;
  
  // Object Scan
  heap: boolean;
  clustered: boolean;
  nonClustered: boolean;
  missingIndex: boolean;
  clusteredColumnstore: boolean;
  nonClusteredColumnstore: boolean;
  ignoreReadOnlyFilegroups: boolean;
  ignoreObjectPermissions: boolean;
  ignoreHeapWithCompression: boolean;
  onlyWhenRowsGreaterThan1000: boolean;
  
  // Indexes
  fragmentationScanMode: string;
  dataCompression: string;
  fillFactor: number;
  maxDop: number;
  lobCompaction: boolean;
  sortInTempdb: boolean;
  padIndex: boolean;
  online: boolean;
  waitAtLowPriority: boolean;
  maxDuration: number;
  abortAfterWait: string;
  statisticsSamplePercent: number;
  statisticsNoRecompute: string;
}

@Component({
  selector: 'app-index-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AngularSvgIconModule, NgxSliderModule],
  templateUrl: './index-settings.component.html',
  styleUrl: './index-settings.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class IndexSettingsComponent implements AfterViewInit {
  settingsForm: FormGroup;
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  
  // Cached slider options to prevent change detection issues
  private _objectReorgSizeSliderOptions: Options | null = null;
  private _objectReorgSizeCurrentSliderOptions: Options | null = null;
  private _objectRebuildSizeCurrentSliderOptions: Options | null = null;
  private _fragmentationThresholdSliderOptions: Options | null = null;

  // Slider values for dual-range slider (bound to form)
  get objectReorgSizeMinValue(): number {
    return this.settingsForm.get('objectReorgSizeMin')?.value || 0;
  }
  set objectReorgSizeMinValue(value: number) {
    this.settingsForm.patchValue({ objectReorgSizeMin: value }, { emitEvent: false });
    this.ensureCurrentWithinRange();
  }

  get objectReorgSizeMaxValue(): number {
    const value = this.settingsForm.get('objectReorgSizeMax')?.value;
    // Ensure max value is within valid range
    if (value === null || value === undefined) {
      return 256; // Default to ceil value
    }
    return Math.max(Math.min(value, 256), 0); // Clamp between 0 and 256
  }
  set objectReorgSizeMaxValue(value: number) {
    const clampedValue = Math.max(Math.min(value, 256), 0); // Clamp between 0 and 256
    this.settingsForm.patchValue({ objectReorgSizeMax: clampedValue }, { emitEvent: false });
    this.ensureMinLessThanMax();
    this.ensureCurrentWithinRange();
  }

  // Slider value for single-range slider (current value)
  get objectReorgSizeCurrentValue(): number {
    const value = this.settingsForm.get('objectReorgSizeCurrent')?.value;
    if (value === null || value === undefined) {
      return 121; // Default value
    }
    // Ensure current value is within min-max range
    const min = this.settingsForm.get('objectReorgSizeMin')?.value || 0;
    const max = this.settingsForm.get('objectReorgSizeMax')?.value || 256;
    return Math.max(Math.min(value, max), min);
  }
  set objectReorgSizeCurrentValue(value: number) {
    // Clamp between min and max
    const min = this.settingsForm.get('objectReorgSizeMin')?.value || 0;
    const max = this.settingsForm.get('objectReorgSizeMax')?.value || 256;
    const clampedValue = Math.max(Math.min(value, max), min);
    this.settingsForm.patchValue({ objectReorgSizeCurrent: clampedValue }, { emitEvent: false });
  }

  // Slider options for single-range slider (current value - rerorg)
  get objectReorgSizeCurrentSliderOptions(): Options {
    if (!this._objectReorgSizeCurrentSliderOptions) {
      const min = this.settingsForm.get('objectReorgSizeMin')?.value || 0;
      const max = this.settingsForm.get('objectReorgSizeMax')?.value || 256;
      this._objectReorgSizeCurrentSliderOptions = {
        floor: Math.max(0, min),
        ceil: Math.min(256, max),
        step: 1,
        animate: false, // Disable animation to prevent change detection issues
        getPointerColor: () => {
          return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2490FF';
        },
        getSelectionBarColor: () => {
          return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2490FF';
        },
        showTicks: false,
        showTicksValues: false,
        hidePointerLabels: false,
        hideLimitLabels: true,
        translate: (value: number, label: LabelType): string => {
          return `${this.formatSize(value)}`;
        },
      };
    }
    return this._objectReorgSizeCurrentSliderOptions;
  }

  // Slider value for rebuild single-range slider (current value)
  get objectRebuildSizeCurrentValue(): number {
    const value = this.settingsForm.get('objectRebuildSizeCurrent')?.value;
    if (value === null || value === undefined) {
      return 8192; // Default value
    }
    // Ensure current value is within min-max range
    const min = this.settingsForm.get('objectRebuildSizeMin')?.value || 512;
    const max = this.settingsForm.get('objectRebuildSizeMax')?.value || 131072;
    return Math.max(Math.min(value, max), min);
  }
  set objectRebuildSizeCurrentValue(value: number) {
    // Clamp between min and max
    const min = this.settingsForm.get('objectRebuildSizeMin')?.value || 512;
    const max = this.settingsForm.get('objectRebuildSizeMax')?.value || 131072;
    const clampedValue = Math.max(Math.min(value, max), min);
    this.settingsForm.patchValue({ objectRebuildSizeCurrent: clampedValue }, { emitEvent: false });
  }

  // Slider options for rebuild single-range slider (current value)
  get objectRebuildSizeCurrentSliderOptions(): Options {
    if (!this._objectRebuildSizeCurrentSliderOptions) {
      const min = this.settingsForm.get('objectRebuildSizeMin')?.value || 512;
      this._objectRebuildSizeCurrentSliderOptions = {
        floor: 512,
        ceil: 131072,
        step: 1,
        animate: false, // Disable animation to prevent change detection issues
        getPointerColor: () => {
          return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2490FF';
        },
        getSelectionBarColor: () => {
          return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2490FF';
        },
        showTicks: false,
        showTicksValues: false,
        hidePointerLabels: false,
        hideLimitLabels: true,
        showSelectionBarFromValue: min,
        showSelectionBarEnd: true,
        translate: (value: number, label: LabelType): string => {
          return `${this.formatSize(value)}`;
        },
      };
    }
    return this._objectRebuildSizeCurrentSliderOptions;
  }

  // Slider options for dual-range slider
  get objectReorgSizeSliderOptions(): Options {
    if (!this._objectReorgSizeSliderOptions) {
      const min = this.settingsForm.get('objectReorgSizeMin')?.value || 0;
      this._objectReorgSizeSliderOptions = {
        floor: 0,
        ceil: 256,
        step: 1,
        animate: false, // Disable animation to prevent change detection issues
        getPointerColor: () => {
          return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2490FF';
        },
        getSelectionBarColor: () => {
          return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2490FF';
        },
        showTicks: false,
        showTicksValues: false,
        hidePointerLabels: false,
        hideLimitLabels: true,
        showSelectionBarEnd: true,
        translate: (value: number, label: LabelType): string => {
          return `${this.formatSize(value)}`;
        },
      };
    }
    return this._objectReorgSizeSliderOptions;
  }

  // Fragmentation threshold slider values (dual-range)
  get fragmentationThresholdMinValue(): number {
    return this.settingsForm.get('ignoreThreshold')?.value || 15;
  }
  set fragmentationThresholdMinValue(value: number) {
    const clampedValue = Math.max(Math.min(value, 100), 0);
    const currentMax = this.settingsForm.get('reorganizeThreshold')?.value || 30;
    const finalValue = Math.min(clampedValue, currentMax); // Ensure min doesn't exceed max
    // First point changes ignoreThreshold and reorganize's first percentage (lower bound)
    this.settingsForm.patchValue({ ignoreThreshold: finalValue }, { emitEvent: false });
  }

  get fragmentationThresholdMaxValue(): number {
    return this.settingsForm.get('reorganizeThreshold')?.value || 30;
  }
  set fragmentationThresholdMaxValue(value: number) {
    const clampedValue = Math.max(Math.min(value, 100), 0);
    const currentMin = this.settingsForm.get('ignoreThreshold')?.value || 15;
    const finalValue = Math.max(clampedValue, currentMin); // Ensure max doesn't go below min
    // Second point updates reorganize's second percentage and rebuild percentage
    this.settingsForm.patchValue({ 
      reorganizeThreshold: finalValue,
      rebuildThreshold: finalValue 
    }, { emitEvent: false });
  }

  // Slider options for fragmentation threshold dual-range slider
  get fragmentationThresholdSliderOptions(): Options {
    if (!this._fragmentationThresholdSliderOptions) {
      this._fragmentationThresholdSliderOptions = {
        floor: 0,
        ceil: 100,
        step: 1,
        animate: false, // Disable animation to prevent change detection issues
        getPointerColor: () => {
          return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2490FF';
        },
        getSelectionBarColor: () => {
          return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2490FF';
        },
        showTicks: false,
        showTicksValues: false,
        hidePointerLabels: false,
        hideLimitLabels: true,
        showSelectionBarEnd: true,
        translate: (value: number, label: LabelType): string => {
          return `${value}%`;
        },
      };
    }
    return this._fragmentationThresholdSliderOptions;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Partial<IndexSettingsData> | null,
    public dialogRef: MatDialogRef<IndexSettingsComponent>
  ) {
    const defaultData: IndexSettingsData = {
      objectReorgSizeMin: 6,
      objectReorgSizeMax: 128, // Must be within ceil range (0-256)
      objectReorgSizeCurrent: 121,
      objectRebuildSizeMin: 512,
      objectRebuildSizeMax: 131072,
      objectRebuildSizeCurrent: 8192,
      ignoreThreshold: 15,
      reorganizeThreshold: 30,
      rebuildThreshold: 30,
      heap: true,
      clustered: true,
      nonClustered: true,
      missingIndex: false,
      clusteredColumnstore: true,
      nonClusteredColumnstore: true,
      ignoreReadOnlyFilegroups: true,
      ignoreObjectPermissions: true,
      ignoreHeapWithCompression: false,
      onlyWhenRowsGreaterThan1000: false,
      fragmentationScanMode: 'LIMITED',
      dataCompression: 'DEFAULT',
      fillFactor: 0,
      maxDop: 0,
      lobCompaction: true,
      sortInTempdb: true,
      padIndex: false,
      online: false,
      waitAtLowPriority: false,
      maxDuration: 1,
      abortAfterWait: 'NONE',
      statisticsSamplePercent: 100,
      statisticsNoRecompute: 'DEFAULT',
      ...data
    };

    this.settingsForm = this.fb.group({
      // Filters
      objectReorgSizeMin: [defaultData.objectReorgSizeMin],
      objectReorgSizeMax: [defaultData.objectReorgSizeMax],
      objectReorgSizeCurrent: [defaultData.objectReorgSizeCurrent],
      objectRebuildSizeMin: [defaultData.objectRebuildSizeMin],
      objectRebuildSizeMax: [defaultData.objectRebuildSizeMax],
      objectRebuildSizeCurrent: [defaultData.objectRebuildSizeCurrent],
      ignoreThreshold: [defaultData.ignoreThreshold],
      reorganizeThreshold: [defaultData.reorganizeThreshold],
      rebuildThreshold: [defaultData.rebuildThreshold],
      
      // Object Scan
      heap: [defaultData.heap],
      clustered: [defaultData.clustered],
      nonClustered: [defaultData.nonClustered],
      missingIndex: [defaultData.missingIndex],
      clusteredColumnstore: [defaultData.clusteredColumnstore],
      nonClusteredColumnstore: [defaultData.nonClusteredColumnstore],
      ignoreReadOnlyFilegroups: [defaultData.ignoreReadOnlyFilegroups],
      ignoreObjectPermissions: [defaultData.ignoreObjectPermissions],
      ignoreHeapWithCompression: [defaultData.ignoreHeapWithCompression],
      onlyWhenRowsGreaterThan1000: [defaultData.onlyWhenRowsGreaterThan1000],
      
      // Indexes
      fragmentationScanMode: [defaultData.fragmentationScanMode],
      dataCompression: [defaultData.dataCompression],
      fillFactor: [defaultData.fillFactor],
      maxDop: [defaultData.maxDop],
      lobCompaction: [defaultData.lobCompaction],
      sortInTempdb: [defaultData.sortInTempdb],
      padIndex: [defaultData.padIndex],
      online: [defaultData.online],
      waitAtLowPriority: [defaultData.waitAtLowPriority],
      maxDuration: [defaultData.maxDuration],
      abortAfterWait: [defaultData.abortAfterWait],
      statisticsSamplePercent: [defaultData.statisticsSamplePercent],
      statisticsNoRecompute: [defaultData.statisticsNoRecompute],
    });
  }

  ngAfterViewInit(): void {
    // Initialize cached slider options after view init to prevent change detection issues
    // Accessing the getters will cache the options
    this.objectReorgSizeSliderOptions;
    this.objectReorgSizeCurrentSliderOptions;
    this.objectRebuildSizeCurrentSliderOptions;
    this.fragmentationThresholdSliderOptions;
    
    // Defer change detection to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.cdr.detectChanges();
      this.attachTooltips();
    }, 100);
  }

  attachTooltips(): void {
    // Attach tooltips to slider pointers using title attributes
    const tooltipData = {
      'reorganize-min': 'Min Size (Reorganize): Sets the minimum object size for reorganization operations. Objects smaller than this will be ignored.',
      'reorganize-max': 'Max Size (Reorganize): Sets the maximum object size for reorganization operations. Objects larger than this will be rebuilt instead.',
      'rebuild-threshold': 'Rebuild Threshold: Sets the minimum object size for rebuild operations. Objects at or above this size will be rebuilt instead of reorganized.',
      'fragmentation-min': 'Ignore Threshold: Objects with fragmentation below this percentage will be ignored. No action will be taken on these objects.',
      'fragmentation-max': 'Reorganize/Rebuild Threshold: Objects with fragmentation at or above this percentage will be reorganized (if within size range) or rebuilt (if larger).'
    };

    // Find all slider pointers and attach tooltips
    setTimeout(() => {
      const reorganizeSlider = document.querySelector('.custom-slider-range[data-tooltip-min]');
      if (reorganizeSlider) {
        const pointers = reorganizeSlider.querySelectorAll('.ngx-slider-pointer');
        if (pointers.length >= 2) {
          pointers[0].setAttribute('title', tooltipData['reorganize-min']);
          pointers[0].setAttribute('data-tooltip', tooltipData['reorganize-min']);
          pointers[1].setAttribute('title', tooltipData['reorganize-max']);
          pointers[1].setAttribute('data-tooltip', tooltipData['reorganize-max']);
        }
      }

      const rebuildSlider = document.querySelector('.custom-slider[data-tooltip]');
      if (rebuildSlider) {
        const pointer = rebuildSlider.querySelector('.ngx-slider-pointer');
        if (pointer) {
          pointer.setAttribute('title', tooltipData['rebuild-threshold']);
          pointer.setAttribute('data-tooltip', tooltipData['rebuild-threshold']);
        }
      }

      const fragmentationSlider = document.querySelector('.custom-slider-range[data-tooltip-min][data-tooltip-max]');
      if (fragmentationSlider) {
        const pointers = fragmentationSlider.querySelectorAll('.ngx-slider-pointer');
        if (pointers.length >= 2) {
          pointers[0].setAttribute('title', tooltipData['fragmentation-min']);
          pointers[0].setAttribute('data-tooltip', tooltipData['fragmentation-min']);
          pointers[1].setAttribute('title', tooltipData['fragmentation-max']);
          pointers[1].setAttribute('data-tooltip', tooltipData['fragmentation-max']);
        }
      }
    }, 200);
  }

  onDefaults() {
    // Reset to default values
    this.settingsForm.patchValue({
      objectReorgSizeMin: 6,
      objectReorgSizeMax: 128, // Must be within ceil range
      objectReorgSizeCurrent: 121,
      objectRebuildSizeMin: 512,
      objectRebuildSizeMax: 131072,
      objectRebuildSizeCurrent: 8192,
      ignoreThreshold: 15,
      reorganizeThreshold: 30,
      rebuildThreshold: 30,
      heap: true,
      clustered: true,
      nonClustered: true,
      missingIndex: false,
      clusteredColumnstore: true,
      nonClusteredColumnstore: true,
      ignoreReadOnlyFilegroups: true,
      ignoreObjectPermissions: true,
      ignoreHeapWithCompression: false,
      onlyWhenRowsGreaterThan1000: false,
      fragmentationScanMode: 'LIMITED',
      dataCompression: 'DEFAULT',
      fillFactor: 0,
      maxDop: 0,
      lobCompaction: true,
      sortInTempdb: true,
      padIndex: false,
      online: false,
      waitAtLowPriority: false,
      maxDuration: 1,
      abortAfterWait: 'NONE',
      statisticsSamplePercent: 100,
      statisticsNoRecompute: 'DEFAULT',
    });
  }

  onOk() {
    this.dialogRef.close(this.settingsForm.value);
  }

  onCancel() {
    this.dialogRef.close();
  }

  formatSize(value: number): string {
    if (value < 1024) {
      return `${value} MB`;
    } else {
      return `${(value / 1024).toFixed(2)} GB`;
    }
  }

  ensureMinLessThanMax() {
    const min = this.settingsForm.get('objectReorgSizeMin')?.value || 0;
    const max = this.settingsForm.get('objectReorgSizeMax')?.value || 256;
    
    // Clamp values to valid range
    const clampedMin = Math.max(Math.min(min || 0, 256), 0);
    const clampedMax = Math.max(Math.min(max || 256, 256), 0);
    
    if (clampedMin >= clampedMax) {
      if (clampedMin >= clampedMax) {
        this.settingsForm.patchValue({ objectReorgSizeMin: Math.max(0, clampedMax - 1) });
      }
      if (clampedMax <= clampedMin) {
        this.settingsForm.patchValue({ objectReorgSizeMax: Math.min(256, clampedMin + 1) });
      }
    } else {
      // Ensure values are clamped
      if (min !== clampedMin) {
        this.settingsForm.patchValue({ objectReorgSizeMin: clampedMin });
      }
      if (max !== clampedMax) {
        this.settingsForm.patchValue({ objectReorgSizeMax: clampedMax });
      }
    }
    this.ensureCurrentWithinRange();
  }

  ensureCurrentWithinRange() {
    const min = this.settingsForm.get('objectReorgSizeMin')?.value || 0;
    const max = this.settingsForm.get('objectReorgSizeMax')?.value || 256;
    const current = this.settingsForm.get('objectReorgSizeCurrent')?.value || 121;
    
    if (current < min) {
      this.settingsForm.patchValue({ objectReorgSizeCurrent: min });
    } else if (current > max) {
      this.settingsForm.patchValue({ objectReorgSizeCurrent: max });
    }
  }

  openSelectDropdown(event: Event) {
    const button = event.currentTarget as HTMLElement;
    const relativeContainer = button.closest('.relative');
    if (relativeContainer) {
      const select = relativeContainer.querySelector('select') as HTMLSelectElement;
      if (select) {
        select.click();
      }
    }
  }
}

