import { Injectable } from '@angular/core';
import { UserIdleService, UserIdleConfig } from 'angular-user-idle';
import { AuthService } from './authservice.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../components/dialog/dialog.component';
import { BehaviorSubject } from 'rxjs';
import { AppConfigService } from 'src/app/app-config.service';
import * as appConstants from 'src/app/app.constants';
import { LogoutService } from './logout.service';

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
  timer = new UserIdleConfig();

  idle: number;
  timeout: number;
  ping: number;
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
    (this.idle = Number(
      this.configservice.getConfigByKey(appConstants.SESSION_IDLE_TIMEOUT)
    )),
      (this.timeout = Number(
        this.configservice.getConfigByKey(appConstants.SESSION_IDLE_TIMER)
      )),
      (this.ping = Number(
        this.configservice.getConfigByKey(appConstants.SESSION_IDLE_PING)
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
    this.timer.idle = this.idle;
    this.timer.ping = this.ping;
    this.timer.timeout = this.timeout;
    this.userIdle.setConfigValues(this.timer);
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
      res => {
        if (res === 1) {
          this.setisActive(false);
          this.openPopUp();
        } else {
          if (this.isActive) {
            console.log("active");
            if (this.dialogref) this.dialogref.close();
            this.userIdle.resetTimer();
          }
        }
      },
      () => { },
      () => { }
    );


    this.userIdle.onTimeout().subscribe(() => {
      if (!this.isActive) {
        this.onLogOut();
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

    setTimeout(() => {
      this.userIdle.stopWatching();
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
