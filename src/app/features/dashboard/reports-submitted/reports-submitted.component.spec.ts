import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsSubmittedComponent } from './reports-submitted.component';

describe('ReportsSubmittedComponent', () => {
  let component: ReportsSubmittedComponent;
  let fixture: ComponentFixture<ReportsSubmittedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportsSubmittedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsSubmittedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
