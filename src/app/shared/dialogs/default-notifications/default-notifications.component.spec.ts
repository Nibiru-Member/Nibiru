import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultNotificationsComponent } from './default-notifications.component';

describe('DefaultNotificationsComponent', () => {
  let component: DefaultNotificationsComponent;
  let fixture: ComponentFixture<DefaultNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultNotificationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefaultNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
