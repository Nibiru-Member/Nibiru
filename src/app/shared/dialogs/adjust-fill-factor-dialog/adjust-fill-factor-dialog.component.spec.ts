import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdjustFillFactorDialogComponent } from './adjust-fill-factor-dialog.component';

describe('AdjustFillFactorDialogComponent', () => {
  let component: AdjustFillFactorDialogComponent;
  let fixture: ComponentFixture<AdjustFillFactorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdjustFillFactorDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdjustFillFactorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
