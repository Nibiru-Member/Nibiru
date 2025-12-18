import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceCheckComponent } from './resource-check.component';

describe('ResourceCheckComponent', () => {
  let component: ResourceCheckComponent;
  let fixture: ComponentFixture<ResourceCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceCheckComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
