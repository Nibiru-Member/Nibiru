import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubLookupDialogComponent } from './sub-lookup-dialog.component';

describe('SubLookupDialogComponent', () => {
  let component: SubLookupDialogComponent;
  let fixture: ComponentFixture<SubLookupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubLookupDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubLookupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
