function resolve(value) {
    return new BasicPromise(value);
}
exports.resolve = resolve;
function resolveIterator(valueIterator) {
    return new BasicPromise(valueIterator);
}
exports.resolveIterator = resolveIterator;
function reject(error) {
    return new BasicPromise(null, error);
}
exports.reject = reject;
var AbstractMLService = (function () {
    function AbstractMLService() {
        this.observableFactory = function () {
            return new BasicSubject();
        };
    }
    return AbstractMLService;
})();
exports.AbstractMLService = AbstractMLService;
var BasicSubject = (function () {
    function BasicSubject() {
        this.observers = [];
        this.index = 0;
        this.unsubscribed = false;
    }
    BasicSubject.prototype.map = function (selector) {
        var observable = new BasicSubject();
        var self = this;
        var onNext = observable.next;
        var onError = observable.error;
        var onCompleted = observable.complete;
        this.subscribe({
            next: function (value) {
                onNext.call(observable, selector(value));
            },
            error: function (exception) {
                onError.call(observable, exception);
            },
            complete: function () {
                onCompleted.call(observable);
            }
        });
        observable.next = this.next.bind(this);
        observable.error = this.error.bind(this);
        observable.complete = this.complete.bind(this);
        return observable;
    };
    BasicSubject.prototype.next = function (value) {
        if (!this.unsubscribed) {
            this.observers.forEach(function (observer) {
                observer.next(value);
            });
        }
    };
    BasicSubject.prototype.error = function (e) {
        if (!this.unsubscribed) {
            this.observers.forEach(function (observer) {
                observer.error(e);
            });
        }
    };
    BasicSubject.prototype.complete = function () {
        if (!this.unsubscribed) {
            this.observers.forEach(function (observer) {
                observer.complete();
            });
        }
    };
    BasicSubject.prototype.subscribe = function (observer) {
        if (!this.unsubscribed) {
            this.observers.push(observer);
        }
        var self = this;
        return function () {
            self.unsubscribed = true;
            self.observers = [];
        };
    };
    return BasicSubject;
})();
exports.BasicSubject = BasicSubject;
var BasicPromise = (function () {
    function BasicPromise(value, error) {
        if (Array.isArray(value)) {
            value = xdmp.arrayValues(value);
        }
        this.value = value;
        this.error = error;
    }
    BasicPromise.prototype.then = function (onfulfilled, onrejected) {
        return this._then(onfulfilled, onrejected, true);
    };
    BasicPromise.prototype._then = function (onfulfilled, onrejected, convertArrays) {
        try {
            if (this.value !== undefined) {
                if (onfulfilled) {
                    var value = this.value;
                    if (convertArrays && value instanceof ValueIterator) {
                        value = value.toArray().map(function (obj) {
                            if (obj.root && obj.root.toObject) {
                                return obj.root.toObject();
                            }
                            else if (obj.toObject) {
                                return obj.toObject();
                            }
                            else {
                                return obj;
                            }
                        });
                    }
                    var ret = onfulfilled(value);
                    if (ret && ret.then) {
                        return ret;
                    }
                    else {
                        return new BasicPromise(ret);
                    }
                }
                else {
                    return this;
                }
            }
            else {
                if (onrejected) {
                    var ret = onrejected(this.error);
                    if (ret && ret.then) {
                        return ret;
                    }
                    else {
                        return new BasicPromise(ret);
                    }
                }
                else {
                    return this;
                }
            }
        }
        catch (e) {
            return new BasicPromise(undefined, e);
        }
    };
    BasicPromise.prototype.catch = function (onrejected) {
        if (this.error) {
            try {
                var ret = onrejected(this.error);
                if (ret && ret.then) {
                    return ret;
                }
                else {
                    return new BasicPromise(ret);
                }
            }
            catch (e) {
                return new BasicPromise(undefined, e);
            }
        }
        else {
            return this;
        }
    };
    return BasicPromise;
})();
exports.BasicPromise = BasicPromise;
var RemoteProxy = (function () {
    function RemoteProxy(uri, options) {
        this.uri = uri;
        this.options = options || {};
    }
    RemoteProxy.prototype.invokeMethod = function (methodName) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var ret = xdmp.httpPost(this.uri + '-' + methodName, this.options, args).toArray();
        var status = ret[0];
        if (status.code === 200) {
            var value = ret[1].toObject();
            return resolve(value);
        }
        else {
            return reject(status.message);
        }
    };
    return RemoteProxy;
})();
exports.RemoteProxy = RemoteProxy;
var HttpObserver = (function () {
    function HttpObserver(uri, options) {
        this.uri = uri;
        if (this.uri.indexOf('://') === -1) {
            this.uri = 'http://' + this.uri;
        }
        this.options = options || {};
    }
    HttpObserver.prototype.next = function (value) {
        xdmp.httpPost(this.uri, this.options, { value: value });
    };
    HttpObserver.prototype.error = function (exception) {
        xdmp.httpPost(this.uri, this.options, { error: exception });
    };
    HttpObserver.prototype.complete = function () {
    };
    return HttpObserver;
})();
exports.HttpObserver = HttpObserver;
//# sourceMappingURL=rfp.js.map