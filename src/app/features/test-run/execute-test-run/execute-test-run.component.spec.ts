import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecuteTestRunComponent } from './execute-test-run.component';

describe('ExecuteTestRunComponent', () => {
  let component: ExecuteTestRunComponent;
  let fixture: ComponentFixture<ExecuteTestRunComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExecuteTestRunComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecuteTestRunComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
