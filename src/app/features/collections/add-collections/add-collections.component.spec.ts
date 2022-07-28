import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCollectionsComponent } from './add-collections.component';

describe('AddCollectionsComponent', () => {
  let component: AddCollectionsComponent;
  let fixture: ComponentFixture<AddCollectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCollectionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCollectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
