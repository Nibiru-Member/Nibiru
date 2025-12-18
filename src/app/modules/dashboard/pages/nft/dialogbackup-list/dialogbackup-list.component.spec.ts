import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogbackupListComponent } from './dialogbackup-list.component';

describe('DialogbackupListComponent', () => {
  let component: DialogbackupListComponent;
  let fixture: ComponentFixture<DialogbackupListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogbackupListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogbackupListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
