import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from 'src/app/core/services/user-profile.service';

@Component({
  selector: 'app-admin-console',
  templateUrl: './admin-console.component.html',
  styleUrls: ['./admin-console.component.css']
})
export class AdminConsoleComponent implements OnInit {
  textDirection: any = this.userProfileService.getTextDirection();
  
  constructor(
    private translate: TranslateService,
    private userProfileService: UserProfileService
  ) { }

  ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
  }

}
