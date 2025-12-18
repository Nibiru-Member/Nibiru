import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDefagBackupComponent } from './dialog-defag-backup.component';

describe('DialogDefagBackupComponent', () => {
  let component: DialogDefagBackupComponent;
  let fixture: ComponentFixture<DialogDefagBackupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogDefagBackupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogDefagBackupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
