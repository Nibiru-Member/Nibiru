import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoDiscoveryComfirmationComponent } from './auto-discovery-comfirmation.component';

describe('AutoDiscoveryComfirmationComponent', () => {
  let component: AutoDiscoveryComfirmationComponent;
  let fixture: ComponentFixture<AutoDiscoveryComfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoDiscoveryComfirmationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutoDiscoveryComfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
