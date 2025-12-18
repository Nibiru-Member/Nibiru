import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountLicenceComponent } from './account-licence.component';

describe('AccountLicenceComponent', () => {
  let component: AccountLicenceComponent;
  let fixture: ComponentFixture<AccountLicenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountLicenceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountLicenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
