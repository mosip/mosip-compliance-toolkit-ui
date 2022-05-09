import { Component } from '@angular/core';
import {
  RouterEvent,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
  Router,
} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  
  title = 'mosip-compliance-toolkit-ui';
  
  loading = true;

  navigationInterceptor(event: RouterEvent): void {
    if (event instanceof NavigationStart) {
      console.log("NavigationStart");
      this.loading = true;
    }
    if (event instanceof NavigationEnd) {
      console.log("NavigationEnd");
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
