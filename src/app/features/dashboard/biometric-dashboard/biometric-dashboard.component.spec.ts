import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BiometricDashboardComponent } from './biometric-dashboard.component';

describe('BiometricDashboardComponent', () => {
  let component: BiometricDashboardComponent;
  let fixture: ComponentFixture<BiometricDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BiometricDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BiometricDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
