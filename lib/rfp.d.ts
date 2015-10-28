export interface Doc<T> {
    uri: string;
    content: DocumentNode<T>;
}
export declare function resolve<T>(value: T): Promise<T>;
export declare function resolveIterator<T>(valueIterator: ValueIterator<T>): Promise<T[]>;
export declare function reject(error: any): Promise<any>;
export declare class AbstractMLService {
    constructor();
    observableFactory: <T>() => Observable<Doc<T>>;
}
export declare class BasicSubject<T> implements Observer<T>, Observable<T> {
    private observers;
    private index;
    private unsubscribed;
    map<TResult>(selector: (value: T) => TResult): Observable<TResult>;
    next(value: T): void;
    error(e: any): void;
    complete(): void;
    subscribe(observer: Observer<T>): () => void;
}
export declare class BasicPromise<T> implements Promise<T> {
    private value;
    private error;
    constructor(value: T, error?: any);
    then<TResult>(onfulfilled?: (value: T) => TResult | Promise<TResult>, onrejected?: (reason: any) => TResult | Promise<TResult>): Promise<TResult>;
    _then<TResult>(onfulfilled?: (value: T) => TResult | Promise<TResult>, onrejected?: (reason: any) => TResult | Promise<TResult>, convertArrays?: boolean): Promise<TResult>;
    catch(onrejected?: (reason: any) => T | Promise<T>): Promise<T>;
}
export declare class RemoteProxy {
    constructor(uri: string, options: {
        [key: string]: string;
    });
    private uri;
    private options;
    invokeMethod<T>(methodName: any, ...args: any[]): Promise<T>;
}
export declare class HttpObserver implements Observer<any> {
    constructor(uri: string, options: {
        [key: string]: string;
    });
    private uri;
    private options;
    next(value: any): void;
    error(exception: any): void;
    complete(): void;
}
