import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackDestinationDialogComponent } from './back-destination-dialog.component';

describe('BackDestinationDialogComponent', () => {
  let component: BackDestinationDialogComponent;
  let fixture: ComponentFixture<BackDestinationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackDestinationDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackDestinationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
