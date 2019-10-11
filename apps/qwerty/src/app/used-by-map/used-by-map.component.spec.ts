import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UsedByMapComponent } from './used-by-map.component';

describe('UsedByMapComponent', () => {
  let component: UsedByMapComponent;
  let fixture: ComponentFixture<UsedByMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UsedByMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsedByMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
