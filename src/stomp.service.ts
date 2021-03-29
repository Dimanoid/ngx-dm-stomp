import { StompClient, StompFrame } from './stomp';
import { BehaviorSubject, Subject } from 'rxjs';

export enum DmStompState {
    Undefined,
    Connecting,
    Connected,
    Disconnecting,
    Disconnected
}

export class DmStompServiceConfig {
    url: string = '';
    login: string = 'guest';
    passcode: string = 'guest';
    heartbeatIn: number = 0;
    heartbeatOut: number =20000;
    ws?: WebSocket;
    host: string = '/';
    protocols?: string[] = ['v10.stomp', 'v11.stomp'];
}


export class StompQ {
    static debug?: (...args: any[]) => void;

    static client(url: string, protocols?: string[]): StompClient {
        if (protocols == null) {
            protocols = ['v10.stomp', 'v11.stomp'];
        }
        const ws = new WebSocket(url, protocols);
        return new StompClient(ws);
    }

    static over(ws: WebSocket) {
        return new StompClient(ws);
    }

    static D(...args: any[]) {
        if (this.debug) {
            this.debug(...args);
        }
    }

}

export class DmStompService {

    private _state: DmStompState = DmStompState.Undefined;
    public state: BehaviorSubject<DmStompState> = new BehaviorSubject(DmStompState.Undefined);

    public lastError?: StompFrame;
    public onError: Subject<StompFrame> = new Subject();

    public onConnect: Subject<StompFrame> = new Subject();
    public onDisconnect: Subject<StompFrame> = new Subject();

    public onReceive: Subject<StompFrame> = new Subject();
    public onReceipt: Subject<StompFrame> = new Subject();

    public debug: Subject<any> = new Subject();
    
    private client?: StompClient;

    constructor(private config?: DmStompServiceConfig) {
        if (config) {
            this.configure(config);
        }
    }

    configure(config: DmStompServiceConfig): void {
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

    connect(): boolean {
        if (
            (this._state != DmStompState.Undefined && this._state != DmStompState.Disconnected)
            || !this.client
            || !this.config
        ) {
            return false;
        }
        this.state.next(DmStompState.Connecting);
        this.client.connect(this.config.login, this.config.passcode, this.config.host);
        return true;
    }


    disconnect(headers?: { [id: string]: string }): void {
        this.state.next(DmStompState.Disconnecting);
        this.client!.disconnect(
            () => this.state.next(DmStompState.Disconnected),
            headers
        );
    }

    publish(topic: string, message: string, headers?: { [id: string]: string }) {
        this.client!.send(topic, headers || {}, message);
    }

    subscribe(topic: string, callback: (frame: StompFrame) => void, headers?: { [id: string]: string }): void {
        this.client!.subscribe(topic, (msg) => callback(msg), headers || { ack: 'auto' });
    }

    isConnected(): boolean {
        return this.client ? this.client.connected : false;
    }

}
