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
var DmStompServiceConfig = /** @class */ (function () {
    function DmStompServiceConfig() {
        this.url = '';
        this.login = 'guest';
        this.passcode = 'guest';
        this.heartbeatIn = 0;
        this.heartbeatOut = 20000;
        this.host = '/';
        this.protocols = ['v10.stomp', 'v11.stomp'];
    }
    return DmStompServiceConfig;
}());
export { DmStompServiceConfig };
var StompQ = /** @class */ (function () {
    function StompQ() {
    }
    StompQ.client = function (url, protocols) {
        if (protocols == null) {
            protocols = ['v10.stomp', 'v11.stomp'];
        }
        var ws = new WebSocket(url, protocols);
        return new StompClient(ws);
    };
    StompQ.over = function (ws) {
        return new StompClient(ws);
    };
    StompQ.D = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.debug) {
            this.debug.apply(this, args);
        }
    };
    return StompQ;
}());
export { StompQ };
var DmStompService = /** @class */ (function () {
    function DmStompService(config) {
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
    DmStompService.prototype.configure = function (config) {
        var _this = this;
        this.config = config;
        var ws = this.config.ws || new WebSocket(this.config.url, this.config.protocols);
        this.client = new StompClient(ws);
        this.client.heartbeat.incoming = this.config.heartbeatIn;
        this.client.heartbeat.outgoing = this.config.heartbeatOut;
        this.client.errorCallback = function (f) { return _this.onError.next(f); };
        this.client.connectCallback = function (f) { return _this.onConnect.next(f); };
        this.client.disconnectCallback = function (f) { return _this.onDisconnect.next(f); };
        this.client.onreceive = function (f) { return _this.onReceive.next(f); };
        this.client.onreceipt = function (f) { return _this.onReceipt.next(f); };
    };
    DmStompService.prototype.connect = function () {
        if ((this._state != DmStompState.Undefined && this._state != DmStompState.Disconnected)
            || !this.client
            || !this.config) {
            return false;
        }
        this.state.next(DmStompState.Connecting);
        this.client.connect(this.config.login, this.config.passcode, this.config.host);
        return true;
    };
    DmStompService.prototype.disconnect = function (headers) {
        var _this = this;
        this.state.next(DmStompState.Disconnecting);
        this.client.disconnect(function () { return _this.state.next(DmStompState.Disconnected); }, headers);
    };
    DmStompService.prototype.publish = function (topic, message, headers) {
        this.client.send(topic, headers || {}, message);
    };
    DmStompService.prototype.subscribe = function (topic, callback, headers) {
        this.client.subscribe(topic, function (msg) { return callback(msg); }, headers || { ack: 'auto' });
    };
    DmStompService.prototype.isConnected = function () {
        return this.client ? this.client.connected : false;
    };
    return DmStompService;
}());
export { DmStompService };
//# sourceMappingURL=stomp.service.js.map