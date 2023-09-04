import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionsDashboardComponent } from './collections-dashboard.component';

describe('CollectionsDashboardComponent', () => {
  let component: CollectionsDashboardComponent;
  let fixture: ComponentFixture<CollectionsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CollectionsDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
