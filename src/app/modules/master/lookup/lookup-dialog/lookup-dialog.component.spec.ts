import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LookupDialogComponent } from './lookup-dialog.component';

describe('LookupDialogComponent', () => {
  let component: LookupDialogComponent;
  let fixture: ComponentFixture<LookupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LookupDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LookupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
