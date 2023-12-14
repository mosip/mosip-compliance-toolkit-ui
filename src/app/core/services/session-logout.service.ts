import { Injectable } from '@angular/core';
import { UserIdleService, UserIdleConfig } from 'angular-user-idle';
import { AuthService } from './authservice.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../components/dialog/dialog.component';
import { BehaviorSubject } from 'rxjs';
import { AppConfigService } from 'src/app/app-config.service';
import * as appConstants from 'src/app/app.constants';
import { LogoutService } from './logout.service';
import { environment } from 'src/environments/environment';

/**
 * @description This class is responsible for auto logging out user when he is inactive for a
 *  specified period of time.
 */

@Injectable({
  providedIn: 'root'
})
export class SessionLogoutService {
  private messageAutoLogout = new BehaviorSubject({});
  currentMessageAutoLogout = this.messageAutoLogout.asObservable();
  isActive = false;
  userIdleTimer = new UserIdleConfig();
  isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;

  idleTimeout: number;
  idleTimer: number;
  idlePing: number;
  dialogref: any;
  dialogreflogout: any;

  constructor(
    private userIdle: UserIdleService,
    private authService: AuthService,
    private dialog: MatDialog,
    private configservice: AppConfigService,
    private logoutservice: LogoutService
  ) { }

  /**
   * @description This method gets value of idle,timeout and ping parameter from config file.
   */
  getValues() {
    //  Convert minutes to seconds for idle, timeout, and use the ping value as it is in seconds.
    let config = this.configservice.getConfig();
    (this.idleTimeout = Number(
       config[appConstants.SESSION_IDLE_TIMEOUT] * 60
    )),
      (this.idleTimer = Number(
        config[appConstants.SESSION_IDLE_TIMER] * 60
      )),
      (this.idlePing = Number(
        config[appConstants.SESSION_IDLE_PING]
      ));
  }

  setisActive(value: boolean) {
    this.isActive = value;
  }
  getisActive() {
    return this.isActive;
  }

  changeMessage(message: object) {
    this.messageAutoLogout.next(message);
  }

  /**
   * @description This method sets value of idle,timeout and ping parameter from config file.
   */
  setValues() {
    this.userIdle.stopWatching();
    this.userIdleTimer.idle = this.idleTimeout;
    this.userIdleTimer.ping = this.idlePing;
    this.userIdleTimer.timeout = this.idleTimer;
    this.userIdle.setConfigValues(this.userIdleTimer);
  }

  /**
   * @description This method is fired when dashboard gets loaded and starts the timer to watch for
   * user idle. onTimerStart() is fired when user idle has been detected for specified time.
   * After that onTimeout() is fired.
   */

  public keepWatching() {
    this.userIdle.startWatching();
    this.changeMessage({ timerFired: true });

    this.userIdle.onTimerStart().subscribe(
      (res) => {
        if (res === 1) {
          this.setisActive(false);
          this.openPopUp();
        } else {
          if (this.isActive) {
            if (this.dialogref) this.dialogref.close();
            this.userIdle.resetTimer();
          }
        }
      },
      () => {},
      () => {}
    );

    this.userIdle.onTimeout().subscribe(() => {
      if (!this.isActive) {
        if (!this.isAndroidAppMode) {
          this.onLogOut();
        } else {
          this.dialogref.close();
          this.userIdle.stopWatching();
        }
      } else {
        this.userIdle.resetTimer();
      }
    });
  }

  public continueWatching() {
    this.userIdle.startWatching();
  }
  /**
   * @description This method is used to logged out the user.
   */
  onLogOut() {
    this.dialogref.close();
    this.dialog.closeAll();
    this.popUpPostLogOut();
    this.userIdle.stopWatching();

    /// After displaying the session logout popup for five seconds, initiate the logout process.
    setTimeout(() => {
      this.logoutservice.logout();
    }, 5000);
  }


  /**
   * @description This method opens a pop up when user idle has been detected for given time.id
   */

  openPopUp() {
    const data = {
      case: 'SESSION_TIMEOUT_POPUP',
    };
    this.dialogref = this.dialog.open(DialogComponent, {
      width: '500px',
      data: data
    });
  }
  popUpPostLogOut() {
    const data = {
      case: 'POSTLOGOUT_POPUP',
    };
    this.dialogreflogout = this.dialog.open(DialogComponent, {
      width: '500px',
      data: data
    });
  }
}
