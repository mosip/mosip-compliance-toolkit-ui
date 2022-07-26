import { Component, OnInit } from '@angular/core';
import { BreadcrumbService } from 'xng-breadcrumb';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { AuthService } from '../../../core/services/authservice.service';
import { DataService } from '../../../core/services/data-service';
import { Subscription } from 'rxjs';
import * as appConstants from 'src/app/app.constants';

@Component({
  selector: 'app-view-project',
  templateUrl: './view-project.component.html',
  styleUrls: ['./view-project.component.css'],
})
export class ViewProjectComponent implements OnInit {
  projectId: string;
  projectType: string;
  projectForm = new FormGroup({});
  projectData: any;
  commonControls = ['name', 'projectType'];
  sdkControls = ['sdkUrl', 'sdkPurpose', 'bioTestData'];
  sbiControls = ['specVersion', 'sbiPurpose', 'deviceType', 'deviceSubType'];
  abisControls = ['abisUrl', 'username', 'password', 'queueName'];
  allControls: string[];
  hidePassword = true;
  subscriptions: Subscription[] = [];
  dataLoaded = false;

  constructor(
    public authService: AuthService,
    private dataService: DataService,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private activatedRoute: ActivatedRoute
  ) {}

  async ngOnInit() {
    await this.getProjectId();
    if ((this.projectType = appConstants.SBI)) {
      this.allControls = [...this.commonControls, ...this.sbiControls];

      this.allControls.forEach((controlId) => {
        this.projectForm.addControl(controlId, new FormControl(''));
        this.projectForm.controls[controlId].setValidators(Validators.required);
      });
      await this.getSbiProjectDetails();
    }
    this.breadcrumbService.set(
      '@projectId',
      `View ${this.projectType} Project - ${this.projectId}`
    );
    this.dataLoaded = true;
  }

  getProjectId() {
    return new Promise((resolve) => {
      this.activatedRoute.params.subscribe((param) => {
        this.projectId = param['id'];
        this.projectType = param['projectType'];
        resolve(true);
      });
    });
  }

  async getSbiProjectDetails() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService
          .getSbiProject(this.projectId)
          .subscribe((response: any) => {
            console.log(response);
            this.projectData = response['response'];
            resolve(true);
          })
      );
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
