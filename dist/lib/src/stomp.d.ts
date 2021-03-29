export declare class StompFrame {
    command: string;
    body: string;
    headers: {
        [id: string]: string;
    };
    ack?: (headers: {
        [id: string]: string;
    }) => void;
    nack?: (headers: {
        [id: string]: string;
    }) => void;
    static marshall(command: string, headers: {
        [id: string]: string;
    }, body?: string): string;
    static unmarshall(datas: string): StompFrame[];
    static unmarshallSingle(data: string): StompFrame;
    constructor(command: string, headers: {
        [id: string]: string;
    }, body?: string);
    toString(): string;
    sizeOfUTF8(s: string): number;
}
export declare class StompClient {
    ws: WebSocket;
    counter: number;
    connected: boolean;
    heartbeat: {
        outgoing: number;
        incoming: number;
    };
    maxWebSocketFrameSize: number;
    subscriptions: {
        [id: string]: (frame: StompFrame) => void;
    };
    pinger: any;
    ponger: any;
    headers: {
        [id: string]: string;
    };
    errorCallback?: (frame: StompFrame) => void;
    connectCallback?: (frame: StompFrame) => void;
    disconnectCallback?: (frame?: StompFrame) => void;
    serverActivity: number;
    onreceive?: (frame: StompFrame) => void;
    onreceipt?: (frame: StompFrame) => void;
    debug?: (...args: any[]) => void;
    constructor(ws: WebSocket);
    D(...args: any[]): void;
    now(): number;
    private _transmit;
    private _setupHeartbeat;
    connect(login: string, passcode: string, host: string): void;
    disconnect(disconnectCallback: (frame?: StompFrame) => void, headers?: {
        [id: string]: string;
    }): void;
    private _cleanUp;
    send(destination: string, headers: {
        [id: string]: string;
    }, body: string): void;
    subscribe(destination: string, callback: (frame: StompFrame) => void, headers: {
        [id: string]: string;
    }): {
        id: string;
        unsubscribe: () => void;
    };
    unsubscribe(id: string): void;
    begin(transaction: string): {
        id: string;
        commit: () => void;
        abort: () => void;
    };
    commit(transaction: string): void;
    abort(transaction: string): void;
    ack(messageID: string, subscription: string, headers: {
        [id: string]: string;
    }): void;
    nack(messageID: string, subscription: string, headers: {
        [id: string]: string;
    }): void;
}
