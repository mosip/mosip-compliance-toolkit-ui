import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestcaseDashboardComponent } from './testcase-dashboard.component';

describe('TestcaseDashboardComponent', () => {
  let component: TestcaseDashboardComponent;
  let fixture: ComponentFixture<TestcaseDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestcaseDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestcaseDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
