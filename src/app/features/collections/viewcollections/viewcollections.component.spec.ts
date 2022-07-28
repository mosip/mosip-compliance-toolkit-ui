import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewcollectionsComponent } from './viewcollections.component';

describe('ViewcollectionsComponent', () => {
  let component: ViewcollectionsComponent;
  let fixture: ComponentFixture<ViewcollectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewcollectionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewcollectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
