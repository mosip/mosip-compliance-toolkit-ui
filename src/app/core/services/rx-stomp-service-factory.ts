import { RxStompService } from './rx-stomp.service';

export function rxStompServiceFactory(ctkRxStompConfig: any) {
  const rxStomp = new RxStompService();
  rxStomp.configure(ctkRxStompConfig);
  rxStomp.activate();
  console.log("RX STOMP ACTIVATED");
  return rxStomp;
}