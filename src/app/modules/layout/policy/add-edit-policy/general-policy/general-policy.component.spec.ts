import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralPolicyComponent } from './general-policy.component';

describe('GeneralPolicyComponent', () => {
  let component: GeneralPolicyComponent;
  let fixture: ComponentFixture<GeneralPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralPolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
