import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeOfflineDialogComponent } from './take-offline-dialog.component';

describe('TakeOfflineDialogComponent', () => {
  let component: TakeOfflineDialogComponent;
  let fixture: ComponentFixture<TakeOfflineDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TakeOfflineDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TakeOfflineDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
