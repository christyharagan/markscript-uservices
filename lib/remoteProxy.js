var u = require('uservices');
var m = require('./model');
function createRemoteProxy(service, client, server) {
    var proxy = {};
    u.visitService(service, {
        onMethod: function (method) {
            proxy[method.name] = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                return new Promise(function (resolve, reject) {
                    var resultProvider;
                    switch (m.methodToString(method.method)) {
                        case 'PUT':
                            resultProvider = client.resources.put(service.name + '-' + method.name, {}, JSON.stringify(args));
                            break;
                        case 'POST':
                            resultProvider = client.resources.post(service.name + '-' + method.name, {}, JSON.stringify(args));
                            break;
                    }
                    resultProvider.result(function (value) {
                        if (Array.isArray(value)) {
                            resolve(value.map(function (v) {
                                return v.content;
                            }));
                        }
                        else {
                            resolve(value);
                        }
                    }, reject);
                });
            };
        },
        onEvent: function (event) {
            var observable = server.post('/' + service.name + '-' + event.name).map(function (value) {
                if (value.value) {
                    return value.value;
                }
                else {
                    throw value.error;
                }
            });
            proxy[event.name] = function () {
                return observable;
            };
        }
    });
    return proxy;
}
exports.createRemoteProxy = createRemoteProxy;
//# sourceMappingURL=remoteProxy.js.map