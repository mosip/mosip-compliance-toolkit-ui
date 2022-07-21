import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';

import { AppConfigService } from 'src/app/app-config.service';
import { UserProfileService } from '../../services/user-profile.service';
import { DataService } from '../../services/data-service';
import { LogoutService } from '../../services/logout.service';
import { AuthService } from '../../services/authservice.service';
import { Router } from "@angular/router";
// import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
// import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit {
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
  constructor(
    public authService: AuthService,
    private appConfigService: AppConfigService,
    private userProfileService: UserProfileService,
    private logoutService: LogoutService,
    private dataService: DataService,
    private router: Router,
  ) {
    this.appVersion = appConfigService.getConfig()['version'];
  }
  onItem() {
    this.logoutService.logout();
  }
  ngOnInit() {
    if (this.userProfileService.getDisplayUserName()) {
      this.userName = this.userProfileService.getDisplayUserName();
    } else {
      this.userName = this.userProfileService.getUsername();
    }
  }
  onLogoClick() {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(`toolkit/dashboard`);
    } else {
      this.router.navigateByUrl(``);
    }
  }
}
