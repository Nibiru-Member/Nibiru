import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefragmentPolicyComponent } from './defragment-policy.component';

describe('DefragmentPolicyComponent', () => {
  let component: DefragmentPolicyComponent;
  let fixture: ComponentFixture<DefragmentPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefragmentPolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefragmentPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
