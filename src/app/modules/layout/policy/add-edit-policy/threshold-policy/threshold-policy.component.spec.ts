import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThresholdPolicyComponent } from './threshold-policy.component';

describe('ThresholdPolicyComponent', () => {
  let component: ThresholdPolicyComponent;
  let fixture: ComponentFixture<ThresholdPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThresholdPolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThresholdPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
