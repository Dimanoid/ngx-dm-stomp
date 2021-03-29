// Converted to typescript by Dmitry Mukhin (https://github.com/Dimanoid)
// Generated by CoffeeScript 1.7.1
/*
   Stomp Over WebSocket http://www.jmesnil.net/stomp-websocket/doc/ | Apache License V2.0
   Copyright (C) 2010-2013 [Jeff Mesnil](http://jmesnil.net/)
   Copyright (C) 2012 [FuseSource, Inc.](http://fusesource.com)
 */
var Byte = {
    LF: '\x0A',
    NULL: '\x00'
};
var VERSIONS = {
    V1_0: '1.0',
    V1_1: '1.1',
    V1_2: '1.2',
    supportedVersions: '1.1,1.0'
};
// export interface StompMessage {
//     command: string;
//     headers: any;
//     body: string;
//     ack(headers?: any): void;
//     nack(headers?: any): void;
// }
var StompFrame = /** @class */ (function () {
    function StompFrame(command, headers, body) {
        this.command = command;
        this.headers = headers != null ? headers : {};
        this.body = body != null ? body : '';
    }
    StompFrame.marshall = function (command, headers, body) {
        var frame;
        frame = new StompFrame(command, headers, body);
        return frame.toString() + Byte.NULL;
    };
    StompFrame.unmarshall = function (datas) {
        var ref = datas.split(RegExp('' + Byte.NULL + Byte.LF + '*'));
        var results = [];
        for (var i = 0; i < ref.length; i++) {
            var data = ref[i];
            if (data && data.length > 0) {
                results.push(StompFrame.unmarshallSingle(data));
            }
        }
        return results;
    };
    StompFrame.unmarshallSingle = function (data) {
        var divider = data.search(RegExp('' + Byte.LF + Byte.LF));
        var headerLines = data.substring(0, divider).split(Byte.LF);
        var command = headerLines.shift();
        var headers = {};
        var trim = function (str) { return str.replace(/^\s+|\s+$/g, ''); };
        var ref = headerLines.reverse();
        for (var i = 0; i < ref.length; i++) {
            var line = ref[i];
            var idx = line.indexOf(':');
            headers[trim(line.substring(0, idx))] = trim(line.substring(idx + 1));
        }
        var body = '';
        var start = divider + 2;
        if (headers['content-length']) {
            var len = parseInt(headers['content-length'], 0);
            body = ('' + data).substring(start, start + len);
        }
        else {
            var chr = null;
            for (var i = start, j = start, ref_1 = data.length; start <= ref_1 ? j < ref_1 : j > ref_1; i = start <= ref_1 ? ++j : --j) {
                chr = data.charAt(i);
                if (chr === Byte.NULL) {
                    break;
                }
                body += chr;
            }
        }
        return new StompFrame(command, headers, body);
    };
    StompFrame.prototype.toString = function () {
        var lines = [this.command];
        var skipContentLength = !this.headers['content-length'];
        if (skipContentLength) {
            delete this.headers['content-length'];
        }
        for (var _i = 0, _a = Object.keys(this.headers); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            lines.push('' + name_1 + ':' + this.headers[name_1]);
        }
        if (this.body && !skipContentLength) {
            lines.push('content-length:' + (this.sizeOfUTF8(this.body)));
        }
        lines.push(Byte.LF + this.body);
        return lines.join(Byte.LF);
    };
    StompFrame.prototype.sizeOfUTF8 = function (s) {
        if (s) {
            var match = encodeURI(s).match(/%..|./g);
            return match ? match.length : 0;
        }
        return 0;
    };
    return StompFrame;
}());
export { StompFrame };
var StompClient = /** @class */ (function () {
    function StompClient(ws) {
        this.counter = 0;
        this.connected = false;
        this.heartbeat = {
            outgoing: 10000,
            incoming: 10000
        };
        this.maxWebSocketFrameSize = 16 * 1024;
        this.subscriptions = {};
        this.headers = {};
        this.serverActivity = 0;
        this.ws = ws;
        this.ws.binaryType = 'arraybuffer';
    }
    StompClient.prototype.D = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.debug) {
            this.debug.apply(this, args);
        }
        ;
    };
    StompClient.prototype.now = function () {
        if (Date.now) {
            return Date.now();
        }
        else {
            return new Date().valueOf();
        }
    };
    StompClient.prototype._transmit = function (command, headers, body) {
        var out = StompFrame.marshall(command, headers, body);
        this.D('>>> ', out);
        while (true) {
            if (out.length > this.maxWebSocketFrameSize) {
                this.ws.send(out.substring(0, this.maxWebSocketFrameSize));
                out = out.substring(this.maxWebSocketFrameSize);
                this.D('remaining = ', out.length);
            }
            else {
                return this.ws.send(out);
            }
        }
    };
    StompClient.prototype._setupHeartbeat = function (headers) {
        var _this = this;
        if (headers.version !== VERSIONS.V1_1 && headers.version !== VERSIONS.V1_2) {
            return;
        }
        var hb = headers['heart-beat'].split(',');
        var serverOutgoing = hb[0];
        var serverIncoming = hb[1];
        if (this.heartbeat.outgoing !== 0 && +serverIncoming !== 0) {
            var ttl = Math.max(this.heartbeat.outgoing, +serverIncoming);
            this.D('send PING every ', ttl, 'ms');
            this.pinger = setInterval(function () {
                _this.ws.send(Byte.LF);
                _this.D('>>> PING');
            }, ttl);
        }
        if (this.heartbeat.incoming !== 0 && +serverOutgoing !== 0) {
            var ttl_1 = Math.max(this.heartbeat.incoming, +serverOutgoing);
            this.D('check PONG every ', ttl_1, 'ms');
            this.ponger = setInterval(function () {
                var delta = _this.now() - _this.serverActivity;
                if (delta > ttl_1 * 2) {
                    _this.D('did not receive server activity for the last', delta, 'ms');
                    _this.ws.close();
                }
            }, ttl_1);
        }
    };
    StompClient.prototype.connect = function (login, passcode, host) {
        var _this = this;
        this.headers['login'] = login;
        this.headers['passcode'] = passcode;
        this.headers['host'] = host;
        this.D('Opening Web Socket...');
        this.ws.onmessage = function (evt) {
            var data;
            if (typeof ArrayBuffer !== 'undefined' && evt.data instanceof ArrayBuffer) {
                var arr = new Uint8Array(evt.data);
                _this.D('--- got data length:', arr.length);
                data = '';
                for (var i = 0; i < arr.length; i++) {
                    data = data + String.fromCharCode(arr[i]);
                }
            }
            else {
                data = evt.data;
            }
            _this.serverActivity = _this.now();
            if (data === Byte.LF) {
                _this.D('<<< PONG');
                return;
            }
            _this.D('<<< ' + data);
            var umData = StompFrame.unmarshall(data);
            var _loop_1 = function (i) {
                var frame = umData[i];
                switch (frame.command) {
                    case 'CONNECTED':
                        _this.D('connected to server ', frame.headers.server);
                        _this.connected = true;
                        _this._setupHeartbeat(frame.headers);
                        if (_this.connectCallback) {
                            _this.connectCallback(frame);
                        }
                        break;
                    case 'MESSAGE':
                        var subscription_1 = frame.headers.subscription;
                        var onreceive = _this.subscriptions[subscription_1] || _this.onreceive;
                        if (onreceive) {
                            var messageID_1 = frame.headers['message-id'];
                            frame.ack = function (headers) {
                                if (headers == null) {
                                    headers = {};
                                }
                                _this.ack(messageID_1, subscription_1, headers);
                            };
                            frame.nack = function (headers) {
                                if (headers == null) {
                                    headers = {};
                                }
                                return _this.nack(messageID_1, subscription_1, headers);
                            };
                            onreceive(frame);
                        }
                        else {
                            _this.D('Unhandled received MESSAGE:', frame);
                        }
                        break;
                    case 'RECEIPT':
                        if (_this.onreceipt) {
                            _this.onreceipt(frame);
                        }
                        break;
                    case 'ERROR':
                        _this.D('ws.readyState:', _this.ws.readyState);
                        if (_this.errorCallback) {
                            _this.errorCallback(frame);
                            _this.D('after errorCallback ws.readyState:', _this.ws.readyState);
                        }
                        break;
                    default:
                        _this.D('Unhandled frame:', frame);
                }
                _this.D('after switch ws.readyState:', _this.ws.readyState);
            };
            for (var i = 0; i < umData.length; i++) {
                _loop_1(i);
            }
            _this.D('after for ws.readyState:', _this.ws.readyState);
        };
        this.ws.onclose = function () {
            var q = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                q[_i] = arguments[_i];
            }
            _this.D('ws.onclose, ws.readyState:', _this.ws.readyState, q);
            _this._cleanUp();
            if (_this.disconnectCallback) {
                _this.disconnectCallback();
            }
        };
        this.ws.onopen = function () {
            _this.D('Web Socket Opened...');
            _this.headers['accept-version'] = VERSIONS.supportedVersions;
            _this.headers['heart-beat'] = [_this.heartbeat.outgoing, _this.heartbeat.incoming].join(',');
            _this._transmit('CONNECT', _this.headers);
        };
    };
    StompClient.prototype.disconnect = function (disconnectCallback, headers) {
        this.D('disconnect, ws.readyState:', this.ws.readyState);
        this._transmit('DISCONNECT', headers || {});
        this.ws.onclose = null;
        this.ws.close();
        this._cleanUp();
        if (disconnectCallback) {
            disconnectCallback();
        }
    };
    StompClient.prototype._cleanUp = function () {
        this.connected = false;
        if (this.pinger) {
            clearInterval(this.pinger);
        }
        if (this.ponger) {
            return clearInterval(this.ponger);
        }
    };
    StompClient.prototype.send = function (destination, headers, body) {
        if (headers == null) {
            headers = {};
        }
        if (body == null) {
            body = '';
        }
        headers.destination = destination;
        return this._transmit('SEND', headers, body);
    };
    StompClient.prototype.subscribe = function (destination, callback, headers) {
        var _this = this;
        if (headers == null) {
            headers = {};
        }
        if (!headers.id) {
            headers.id = 'sub-' + this.counter++;
        }
        headers.destination = destination;
        this.subscriptions[headers.id] = callback;
        this._transmit('SUBSCRIBE', headers);
        return {
            id: headers.id,
            unsubscribe: function () { return _this.unsubscribe(headers.id); }
        };
    };
    StompClient.prototype.unsubscribe = function (id) {
        delete this.subscriptions[id];
        this._transmit('UNSUBSCRIBE', { id: id });
    };
    StompClient.prototype.begin = function (transaction) {
        var _this = this;
        var txid = transaction || 'tx-' + this.counter++;
        this._transmit('BEGIN', {
            transaction: txid
        });
        return {
            id: txid,
            commit: function () { return _this.commit(txid); },
            abort: function () { return _this.abort(txid); }
        };
    };
    StompClient.prototype.commit = function (transaction) {
        return this._transmit('COMMIT', { transaction: transaction });
    };
    StompClient.prototype.abort = function (transaction) {
        this._transmit('ABORT', { transaction: transaction });
    };
    StompClient.prototype.ack = function (messageID, subscription, headers) {
        if (headers == null) {
            headers = {};
        }
        headers['message-id'] = messageID;
        headers.subscription = subscription;
        return this._transmit('ACK', headers);
    };
    StompClient.prototype.nack = function (messageID, subscription, headers) {
        if (headers == null) {
            headers = {};
        }
        headers['message-id'] = messageID;
        headers.subscription = subscription;
        return this._transmit('NACK', headers);
    };
    return StompClient;
}());
export { StompClient };
//# sourceMappingURL=stomp.js.map