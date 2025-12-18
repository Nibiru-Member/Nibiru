import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedulePolicyComponent } from './schedule-policy.component';

describe('SchedulePolicyComponent', () => {
  let component: SchedulePolicyComponent;
  let fixture: ComponentFixture<SchedulePolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulePolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchedulePolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
