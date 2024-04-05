import { Component } from '@angular/core';
import { HostListener } from '@angular/core';
import { SessionLogoutService } from '../app/core/services/session-logout.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {

  subscriptions: Subscription[] = [];
  
  title = 'mosip-compliance-toolkit-ui';

  constructor(
    private sessionLogoutService: SessionLogoutService
  ) {
  }

  @HostListener('keypress')
  @HostListener('document:mousedown', ['$event'])
  @HostListener('document:keypress', ['$event'])
  onMouseClick() {
    this.sessionLogoutService.setisActive(true);
  }

  ngOnInit() {
    this.subscriptions.push(this.sessionLogoutService.currentMessageAutoLogout.subscribe(() => { }));
    this.sessionLogoutService.changeMessage({ timerFired: false });
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
