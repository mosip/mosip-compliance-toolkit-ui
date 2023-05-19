import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { AppConfigService } from 'src/app/app-config.service';
import { UserProfileService } from '../../services/user-profile.service';
import { DataService } from '../../services/data-service';
import { LogoutService } from '../../services/logout.service';
import { AuthService } from '../../services/authservice.service';
import { Router } from "@angular/router";
import { MatDialog } from '@angular/material/dialog';
import Utils from 'src/app/app.utils';
import { environment } from 'src/environments/environment';
import { App } from '@capacitor/app';
import { TranslateService } from '@ngx-translate/core';
import { error } from 'console';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit {
  resourceBundleJson: any = {};
  appVersion: '';
  userName: string;
  profile = {
    type: 'profile',
    name: 'Test Test',
    profileImg: './assets/images/profile.png',
    menuList: [
      {
        name: 'Logout',
        route: null,
      },
    ],
  };
  textDirection: any = this.userProfileService.getTextDirection();
  constructor(
    public authService: AuthService,
    private appConfigService: AppConfigService,
    private userProfileService: UserProfileService,
    private logoutService: LogoutService,
    private dataService: DataService,
    private router: Router,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {
    this.appVersion = appConfigService.getConfig()['version'];
  }
  async onItem() {
    await this.logoutService.logout();
    const isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
    if (isAndroidAppMode) {
      let resourceBundle = this.resourceBundleJson.dialogMessages;
      let successMsg = 'success';
      let logoutMsg = 'logoutMessage';
      const dialogRef = Utils.showSuccessMessage(
        resourceBundle,
        successMsg,
        logoutMsg,
        this.dialog
      );
      dialogRef.afterClosed().subscribe((res) => {
        App.exitApp().catch((error) => {
          console.log(error);
        });
      });
    }
  }
  async ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    if (this.userProfileService.getDisplayUserName()) {
      this.userName = this.userProfileService.getDisplayUserName();
    } else {
      this.userName = this.userProfileService.getUsername();
    }
  }
  async onLogoClick() {
    if (this.authService.isAuthenticated()) {
      await this.router.navigateByUrl(`toolkit/dashboard`);
    } else {
      await this.router.navigateByUrl(``);
    }
  }
}
