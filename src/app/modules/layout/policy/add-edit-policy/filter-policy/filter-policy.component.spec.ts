import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterPolicyComponent } from './filter-policy.component';

describe('FilterPolicyComponent', () => {
  let component: FilterPolicyComponent;
  let fixture: ComponentFixture<FilterPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterPolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
