import { Component } from '@angular/core';
import {
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
  Router  
} from '@angular/router';
import { AppConfigService } from '../app-config.service';

@Component({
  selector: 'main-app-root',
  templateUrl: './main-app.component.html',
  styleUrls: ['./main-app.component.css'],
})
export class MainAppComponent {
  
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

  ngOnInit() {
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

  ngOnDestroy(): void {
  }
}
