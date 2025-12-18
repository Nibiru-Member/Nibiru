import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackupConfirmationComponent } from './backup-confirmation.component';

describe('BackupConfirmationComponent', () => {
  let component: BackupConfirmationComponent;
  let fixture: ComponentFixture<BackupConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackupConfirmationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackupConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
