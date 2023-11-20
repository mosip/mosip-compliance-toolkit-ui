import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyReportsComponent } from './my-reports.component';

describe('MyReportsComponent', () => {
  let component: MyReportsComponent;
  let fixture: ComponentFixture<MyReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyReportsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
