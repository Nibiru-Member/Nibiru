import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditPolicyComponent } from './add-edit-policy.component';

describe('AddEditPolicyComponent', () => {
  let component: AddEditPolicyComponent;
  let fixture: ComponentFixture<AddEditPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditPolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
