import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { AuthService } from '../../../core/services/authservice.service';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data-service';
import * as appConstants from 'src/app/app.constants';

@Component({
  selector: 'app-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css'],
})
export class AddProjectComponent implements OnInit {
  projectForm = new FormGroup({});
  allControls: string[];
  hidePassword = true;
  constructor(
    public authService: AuthService,
    private dataService: DataService,
    
    private router: Router
  ) {}

  ngOnInit(): void {
    
    this.allControls = [
      ...appConstants.commonControls,
      ...appConstants.sbiControls,
      ...appConstants.sdkControls,
      ...appConstants.abisControls,
    ];
    this.allControls.forEach((controlId) => {
      this.projectForm.addControl(controlId, new FormControl(''));
    });
    appConstants.commonControls.forEach((controlId) => {
      this.projectForm.controls[controlId].setValidators(Validators.required);
    });
  }

  handleProjectTypeChange() {
    const projectType = this.projectForm.controls['projectType'].value;
    console.log(`selected project type: ${projectType}`);
    if (projectType == appConstants.SDK) {
      appConstants.sdkControls.forEach((controlId) => {
        this.projectForm.controls[controlId].setValidators(Validators.required);
        if (controlId == 'sdkUrl') {
          this.projectForm.controls[controlId].setValidators([
            Validators.required,
            Validators.pattern('^(http|https)://(.*)'),
          ]);
        }
      });
      appConstants.sbiControls.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
      appConstants.abisControls.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
    }
    if (projectType == appConstants.SBI) {
      appConstants.sbiControls.forEach((controlId) => {
        this.projectForm.controls[controlId].setValidators(Validators.required);
      });
      appConstants.sdkControls.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
      appConstants.abisControls.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
    }
    if (projectType == appConstants.ABIS) {
      appConstants.abisControls.forEach((controlId) => {
        this.projectForm.controls[controlId].setValidators(Validators.required);
        if (controlId == 'abisUrl') {
          this.projectForm.controls[controlId].setValidators([
            Validators.required,
            Validators.pattern('^(http|https)://(.*)'),
          ]);
        }
      });
      appConstants.sbiControls.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
      appConstants.sdkControls.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
    }
  }

  saveProject() {
    appConstants.commonControls.forEach((controlId) => {
      this.projectForm.controls[controlId].markAsTouched();
    });
    this.projectForm.controls['projectType'].markAsTouched();
    const projectType = this.projectForm.controls['projectType'].value;
    console.log(`saveProject for type: ${projectType}`);
    if (projectType == appConstants.SDK) {
      appConstants.sdkControls.forEach((controlId) => {
        this.projectForm.controls[controlId].markAsTouched();
      });
    }
    if (projectType == appConstants.SBI) {
      appConstants.sbiControls.forEach((controlId) => {
        this.projectForm.controls[controlId].markAsTouched();
      });
    }
    if (projectType == appConstants.ABIS) {
      appConstants.abisControls.forEach((controlId) => {
        this.projectForm.controls[controlId].markAsTouched();
      });
    }
    if (this.projectForm.valid) {
      //Save the project in db
      console.log('valid');
    }
  }

  showDashboard() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([`toolkit/dashboard`]);
    } else {
      this.router.navigate([``]);
    }
  }
}
