import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefragmentTablesComponent } from './defragment-tables.component';

describe('DefragmentTablesComponent', () => {
  let component: DefragmentTablesComponent;
  let fixture: ComponentFixture<DefragmentTablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefragmentTablesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefragmentTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
