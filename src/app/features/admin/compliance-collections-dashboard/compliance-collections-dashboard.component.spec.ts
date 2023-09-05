import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceCollectionsDashboardComponent } from './compliance-collections-dashboard.component';

describe('ComplianceCollectionsDashboardComponent', () => {
  let component: ComplianceCollectionsDashboardComponent;
  let fixture: ComponentFixture<ComplianceCollectionsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComplianceCollectionsDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceCollectionsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
