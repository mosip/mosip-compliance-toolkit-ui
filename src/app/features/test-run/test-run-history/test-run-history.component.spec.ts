import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestRunHistoryComponent } from './test-run-history.component';

describe('TestRunHistoryComponent', () => {
  let component: TestRunHistoryComponent;
  let fixture: ComponentFixture<TestRunHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestRunHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestRunHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
