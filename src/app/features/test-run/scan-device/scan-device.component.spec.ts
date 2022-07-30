import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanDeviceComponent } from './scan-device.component';

describe('ScanDeviceComponent', () => {
  let component: ScanDeviceComponent;
  let fixture: ComponentFixture<ScanDeviceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScanDeviceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanDeviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
