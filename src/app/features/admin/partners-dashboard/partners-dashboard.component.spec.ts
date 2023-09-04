import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartnersDashboardComponent } from './partners-dashboard.component';

describe('PartnersDashboardComponent', () => {
  let component: PartnersDashboardComponent;
  let fixture: ComponentFixture<PartnersDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PartnersDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PartnersDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
