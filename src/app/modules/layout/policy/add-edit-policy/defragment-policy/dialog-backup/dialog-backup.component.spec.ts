import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogBackupComponent } from './dialog-backup.component';

describe('DialogBackupComponent', () => {
  let component: DialogBackupComponent;
  let fixture: ComponentFixture<DialogBackupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogBackupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogBackupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
