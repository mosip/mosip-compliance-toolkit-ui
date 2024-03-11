import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../app-config.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  showLandingPage = false;
  constructor(private router: Router, private http: HttpClient, private appConfigService: AppConfigService,) { }

  async ngOnInit() {
    this.showLandingPage = false;
    this.http
      .get(
        `${this.appConfigService.getConfig().SERVICES_BASE_URL
        }authorize/admin/validateToken`
      ).subscribe(async (res: any) => {
        console.log(res);
        if (res && res.errors.length == 0) {
          await this.router.navigateByUrl(`toolkit`);
        } else {
          this.showLandingPage = true;
        }
      },
      (errors) => {
        this.showLandingPage = true;
      }
      );

  }

  async doLogin() {
    await this.router.navigate([`toolkit`]);
  }
}
