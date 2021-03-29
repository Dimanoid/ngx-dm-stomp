import { StompClient, StompFrame } from './stomp';
import { BehaviorSubject, Subject } from 'rxjs';
export declare enum DmStompState {
    Undefined = 0,
    Connecting = 1,
    Connected = 2,
    Disconnecting = 3,
    Disconnected = 4
}
export declare class DmStompServiceConfig {
    url: string;
    login: string;
    passcode: string;
    heartbeatIn: number;
    heartbeatOut: number;
    ws?: WebSocket;
    host: string;
    protocols?: string[];
}
export declare class StompQ {
    static debug?: (...args: any[]) => void;
    static client(url: string, protocols?: string[]): StompClient;
    static over(ws: WebSocket): StompClient;
    static D(...args: any[]): void;
}
export declare class DmStompService {
    private config?;
    private _state;
    state: BehaviorSubject<DmStompState>;
    lastError?: StompFrame;
    onError: Subject<StompFrame>;
    onConnect: Subject<StompFrame>;
    onDisconnect: Subject<StompFrame>;
    onReceive: Subject<StompFrame>;
    onReceipt: Subject<StompFrame>;
    debug: Subject<any>;
    private client?;
    constructor(config?: DmStompServiceConfig | undefined);
    configure(config: DmStompServiceConfig): void;
    connect(): boolean;
    disconnect(headers?: {
        [id: string]: string;
    }): void;
    publish(topic: string, message: string, headers?: {
        [id: string]: string;
    }): void;
    subscribe(topic: string, callback: (frame: StompFrame) => void, headers?: {
        [id: string]: string;
    }): void;
    isConnected(): boolean;
}
