(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define('@dimanoid/stomp', ['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.stomp = {}));
}(this, (function (exports) { 'use strict';

	var STOMP = 1;

	exports.STOMP = STOMP;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=stomp.umd.js.map
