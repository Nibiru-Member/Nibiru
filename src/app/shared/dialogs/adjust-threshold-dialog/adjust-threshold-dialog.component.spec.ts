import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdjustThresholdDialogComponent } from './adjust-threshold-dialog.component';

describe('AdjustThresholdDialogComponent', () => {
  let component: AdjustThresholdDialogComponent;
  let fixture: ComponentFixture<AdjustThresholdDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdjustThresholdDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdjustThresholdDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
