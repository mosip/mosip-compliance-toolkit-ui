import { Component, OnInit, HostListener } from '@angular/core';
import {
  RouterEvent,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
  Router  
} from '@angular/router';
import { filter } from 'rxjs';
import { AppConfigService } from './app-config.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  
  title = 'mosip-compliance-toolkit-ui';
  
  loading = true;

  subscribed: any;

  constructor(
    private router: Router,
    private appConfigService: AppConfigService,

  ) {
    this.subscribed = router.events.subscribe(event => {
      this.navigationInterceptor(event);
    });
    
  }

  navigationInterceptor(event: any): void {
    if (event instanceof NavigationStart) {
      //console.log("NavigationStart");
      this.loading = true;
    }
    if (event instanceof NavigationEnd) {
      //console.log("NavigationEnd");
      this.loading = false;
    }

    // Set loading state to false in both of the below events to hide the spinner in case a request fails
    if (event instanceof NavigationCancel) {
      this.loading = false;
    }
    if (event instanceof NavigationError) {
      this.loading = false;
    }
  }
}
