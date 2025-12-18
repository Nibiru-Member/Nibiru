import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogResourceCheckComponent } from './dialog-resource-check.component';

describe('DialogResourceCheckComponent', () => {
  let component: DialogResourceCheckComponent;
  let fixture: ComponentFixture<DialogResourceCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogResourceCheckComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogResourceCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
