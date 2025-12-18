import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TargetPolicyComponent } from './target-policy.component';

describe('TargetPolicyComponent', () => {
  let component: TargetPolicyComponent;
  let fixture: ComponentFixture<TargetPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TargetPolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TargetPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
