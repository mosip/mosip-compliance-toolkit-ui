import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
} from "@angular/forms";
import { AuthService } from '../../services/authservice.service';
import { Router } from "@angular/router";
import { DataService } from '../../services/data-service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit {
  projectForm = new FormGroup({});
  sdkControls = ['name', 'projectType', 'url', 'purpose', 'bioTestData'];
  constructor(
    public authService: AuthService,
    private dataService: DataService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.sdkControls.forEach(control => {
      this.projectForm.addControl(control, new FormControl(""));
      this.projectForm.controls[control].setValidators(Validators.required);  
    });
  }

  saveProject() {
    console.log("saveProject");
    this.sdkControls.forEach(control => {
      this.projectForm.controls[control].markAsTouched();
    });
    if (this.projectForm.valid) {

    }
  }

  showDashboard() {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(`toolkit/dashboard`);
    } else {
      this.router.navigateByUrl(``);
    }
  }
}

