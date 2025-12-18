import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationPolicyComponent } from './notification-policy.component';

describe('NotificationPolicyComponent', () => {
  let component: NotificationPolicyComponent;
  let fixture: ComponentFixture<NotificationPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationPolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
