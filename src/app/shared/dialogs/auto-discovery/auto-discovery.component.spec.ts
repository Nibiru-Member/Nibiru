import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoDiscoveryComponent } from './auto-discovery.component';

describe('AutoDiscoveryComponent', () => {
  let component: AutoDiscoveryComponent;
  let fixture: ComponentFixture<AutoDiscoveryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoDiscoveryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutoDiscoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
