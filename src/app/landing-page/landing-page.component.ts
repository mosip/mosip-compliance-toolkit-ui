import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../app-config.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  showLandingPage = false;
  subscriptions: Subscription[] = [];

  constructor(private router: Router, private http: HttpClient, private appConfigService: AppConfigService,) { }

  async ngOnInit() {
    this.showLandingPage = false;
    console.log(`LandingPageComponent: ngOnInit: this.showLandingPage : ${this.showLandingPage}`);
    let flag = await this.isUserAuthenticated();
    if (flag) {
      await this.router.navigateByUrl(`toolkit`);
    }
    console.log(`LandingPageComponent: ngOnInit: complete`);
  }

  async isUserAuthenticated() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.http.get(`${this.appConfigService.getConfig().SERVICES_BASE_URL
          }authorize/admin/validateToken`,{ withCredentials: true }).subscribe(
            (res: any) => {
              console.log(res);
              if (res && res.errors && res.errors.length == 0) {
                console.log(`LandingPageComponent: redirecting to toolkit`);
                resolve(true);
              } else {
                console.log(`LandingPageComponent: redirecting to landing`);
                this.showLandingPage = true;
                resolve(false);
              }
            },
            (errors) => {
              this.showLandingPage = true;
              console.log(`LandingPageComponent: errors: this.showLandingPage : ${this.showLandingPage}`);
              resolve(false);
            }
          )
      );
    });
  }

  async doLogin() {
    await this.router.navigate([`toolkit`]);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
