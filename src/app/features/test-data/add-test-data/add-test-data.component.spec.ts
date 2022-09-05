import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTestDataComponent } from './add-test-data.component';

describe('AddTestDataComponent', () => {
  let component: AddTestDataComponent;
  let fixture: ComponentFixture<AddTestDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddTestDataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTestDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
