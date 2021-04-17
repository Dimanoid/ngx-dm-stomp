import { StompClient, StompFrame } from './stomp';
import { BehaviorSubject, Subject } from 'rxjs';

export enum DmStompState {
    Undefined,
    Connecting,
    Connected,
    Disconnecting,
    Disconnected
}

export interface IDmStompConfig {
    url?: string;
    login?: string;
    passcode?: string;
    heartbeatIn?: number;
    heartbeatOut?: number;
    ws?: WebSocket;
    host?: string;
    protocols?: string[];
}

export const DM_STOMP_DEFAULT_CONFIG: IDmStompConfig = {
    url: '',
    login: 'guest',
    passcode: 'guest',
    heartbeatIn: 0,
    heartbeatOut: 20000,
    host: '/',
    protocols: ['v10.stomp', 'v11.stomp']
}

export class DmStomp {

    private _state: DmStompState = DmStompState.Undefined;
    public state: BehaviorSubject<DmStompState> = new BehaviorSubject(DmStompState.Undefined);

    public lastError?: StompFrame;
    public onError: Subject<StompFrame> = new Subject();

    public onConnect: Subject<StompFrame> = new Subject();
    public onDisconnect: Subject<StompFrame> = new Subject();

    public onReceive: Subject<StompFrame> = new Subject();
    public onReceipt: Subject<StompFrame> = new Subject();

    public debug: Subject<any> = new Subject();
    
    public client?: StompClient;

    constructor(private config?: IDmStompConfig) {
        if (config) {
            this.configure(config);
        }
    }

    configure(config: IDmStompConfig): void {
        this.config = Object.assign(Object.assign({}, DM_STOMP_DEFAULT_CONFIG), config);
        const ws = this.config.ws || new WebSocket(this.config.url!, this.config.protocols);
        this.client = new StompClient(ws, {
            error: f => this.onError.next(f),
            connect: f => this.onConnect.next(f),
            disconnect: f => this.onDisconnect.next(f),
            receive: f => this.onReceive.next(f),
            receipt: f => this.onReceipt.next(f),
            debug: (...args) => this.debug.next([...args]),
        });
        this.client.heartbeat.incoming = this.config.heartbeatIn!;
        this.client.heartbeat.outgoing = this.config.heartbeatOut!;
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
        this.client.connect(this.config.login!, this.config.passcode!, this.config.host!);
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

    subscribe(topic: string, callback?: (frame: StompFrame) => void, headers?: { [id: string]: string }): void {
        this.client!.subscribe(topic, (msg) => callback ? callback(msg) : {}, headers || { ack: 'auto' });
    }

    unsubscribe(id: string): void {
        this.client?.unsubscribe(id);
    }

    isConnected(): boolean {
        return this.client ? this.client.connected : false;
    }

}
