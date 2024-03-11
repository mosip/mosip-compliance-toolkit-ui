import { Component, HostListener } from '@angular/core';
import {
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
  Router  
} from '@angular/router';
import { AppConfigService } from '../app-config.service';
import { SessionLogoutService } from '../core/services/session-logout.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'main-app-root',
  templateUrl: './main-app.component.html',
  styleUrls: ['./main-app.component.css'],
})
export class MainAppComponent {
  
  title = 'mosip-compliance-toolkit-ui';
  
  loading = true;

  subscribed: any;

  subscriptions: Subscription[] = [];


  constructor(
    private router: Router,
    private appConfigService: AppConfigService,
    private sessionLogoutService: SessionLogoutService

  ) {
    this.subscribed = router.events.subscribe(event => {
      this.navigationInterceptor(event);
    });
    
  }

  ngOnInit() {
    this.subscriptions.push(this.sessionLogoutService.currentMessageAutoLogout.subscribe(() => { }));
    this.sessionLogoutService.changeMessage({ timerFired: false });
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

  @HostListener('keypress')
  @HostListener('document:mousedown', ['$event'])
  @HostListener('document:keypress', ['$event'])
  onMouseClick() {
    this.sessionLogoutService.setisActive(true);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
