import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTestDataComponent } from './view-test-data.component';

describe('ViewTestDataComponent', () => {
  let component: ViewTestDataComponent;
  let fixture: ComponentFixture<ViewTestDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewTestDataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewTestDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
