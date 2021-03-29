import { StompClient } from './stomp';
import { BehaviorSubject, Subject } from 'rxjs';
export var DmStompState;
(function (DmStompState) {
    DmStompState[DmStompState["Undefined"] = 0] = "Undefined";
    DmStompState[DmStompState["Connecting"] = 1] = "Connecting";
    DmStompState[DmStompState["Connected"] = 2] = "Connected";
    DmStompState[DmStompState["Disconnecting"] = 3] = "Disconnecting";
    DmStompState[DmStompState["Disconnected"] = 4] = "Disconnected";
})(DmStompState || (DmStompState = {}));
export class DmStompServiceConfig {
    constructor() {
        this.url = '';
        this.login = 'guest';
        this.passcode = 'guest';
        this.heartbeatIn = 0;
        this.heartbeatOut = 20000;
        this.host = '/';
        this.protocols = ['v10.stomp', 'v11.stomp'];
    }
}
export class StompQ {
    static client(url, protocols) {
        if (protocols == null) {
            protocols = ['v10.stomp', 'v11.stomp'];
        }
        const ws = new WebSocket(url, protocols);
        return new StompClient(ws);
    }
    static over(ws) {
        return new StompClient(ws);
    }
    static D(...args) {
        if (this.debug) {
            this.debug(...args);
        }
    }
}
export class DmStompService {
    constructor(config) {
        this.config = config;
        this._state = DmStompState.Undefined;
        this.state = new BehaviorSubject(DmStompState.Undefined);
        this.onError = new Subject();
        this.onConnect = new Subject();
        this.onDisconnect = new Subject();
        this.onReceive = new Subject();
        this.onReceipt = new Subject();
        this.debug = new Subject();
        if (config) {
            this.configure(config);
        }
    }
    configure(config) {
        this.config = config;
        const ws = this.config.ws || new WebSocket(this.config.url, this.config.protocols);
        this.client = new StompClient(ws);
        this.client.heartbeat.incoming = this.config.heartbeatIn;
        this.client.heartbeat.outgoing = this.config.heartbeatOut;
        this.client.errorCallback = f => this.onError.next(f);
        this.client.connectCallback = f => this.onConnect.next(f);
        this.client.disconnectCallback = f => this.onDisconnect.next(f);
        this.client.onreceive = f => this.onReceive.next(f);
        this.client.onreceipt = f => this.onReceipt.next(f);
    }
    connect() {
        if ((this._state != DmStompState.Undefined && this._state != DmStompState.Disconnected)
            || !this.client
            || !this.config) {
            return false;
        }
        this.state.next(DmStompState.Connecting);
        this.client.connect(this.config.login, this.config.passcode, this.config.host);
        return true;
    }
    disconnect(headers) {
        this.state.next(DmStompState.Disconnecting);
        this.client.disconnect(() => this.state.next(DmStompState.Disconnected), headers);
    }
    publish(topic, message, headers) {
        this.client.send(topic, headers || {}, message);
    }
    subscribe(topic, callback, headers) {
        this.client.subscribe(topic, (msg) => callback(msg), headers || { ack: 'auto' });
    }
    isConnected() {
        return this.client ? this.client.connected : false;
    }
}
//# sourceMappingURL=stomp.service.js.map