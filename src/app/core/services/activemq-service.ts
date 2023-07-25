import { Injectable } from '@angular/core';

import * as appConstants from 'src/app/app.constants';
import { RxStompService } from './rx-stomp.service';
import { AbisProjectModel } from '../models/abis-project';
import { rxStompServiceFactory } from './rx-stomp-service-factory';
import { Message } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root',
})
export class ActiveMqService {
  constructor() { }

  setUpConfig(abisProjectData: AbisProjectModel) {
    let ctkRxStompConfig = {
      // Which server?
      //brokerURL: 'ws://127.0.0.1:61614/ws',
      brokerURL: abisProjectData.url,
      // Headers
      // Typical keys: login, passcode, host
      connectHeaders: {
        login: abisProjectData.username,
        passcode: abisProjectData.password,
      },
      // How often to heartbeat?
      // Interval in milliseconds, set to 0 to disable
      heartbeatIncoming: 0, // Typical value 0 - disabled
      heartbeatOutgoing: 20000, // Typical value 20000 - every 20 seconds
      // Wait in milliseconds before attempting auto reconnect
      // Set to 0 to disable
      // Typical value 500 (500 milli seconds)
      reconnectDelay: 500,
      // Will log diagnostics on console
      // It can be quite verbose, not recommended in production
      // Skip this key to stop logging to console
      debug: (msg: string): void => {
        //console.log(msg);
      },
    }
    const rxStomp = rxStompServiceFactory(ctkRxStompConfig);
    return rxStomp;
  }

  sendToQueue(rxStompService: RxStompService, abisProjectData: AbisProjectModel, message: string) {
    return new Promise((resolve, reject) => {
      try {
        if (!rxStompService.connected()) {
          rxStompService = this.setUpConfig(abisProjectData);
        }
        rxStompService.publish({ destination: `${abisProjectData.outboundQueueName}`, body: message , skipContentLengthHeader: true});
        resolve({
          [appConstants.STATUS]: appConstants.SUCCESS
        })
      } catch (e) {
        console.log("error in sending request");
        console.log(e);
        resolve({
          [appConstants.STATUS]: appConstants.FAILURE
        })
      }
    });
  }
} 