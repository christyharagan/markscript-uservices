export interface Doc<T> {
  uri: string,
  content: DocumentNode<T>
}

export function resolve<T>(value: T): Promise<T> {
  return new BasicPromise(value)
}

export function resolveIterator<T>(valueIterator: ValueIterator<T>): Promise<T[]> {
  return <any>new BasicPromise(valueIterator)
}

export function reject(error: any): Promise<any> {
  return new BasicPromise(null, error)
}

export class AbstractMLService {
  constructor() {
    this.observableFactory = function() {
      return new BasicSubject()
    }
  }

  observableFactory: <T>() => Observable<Doc<T>>
}

export class BasicSubject<T> implements Observer<T>, Observable<T> {
  private observers: Observer<T>[] = []
  private index: number = 0
  private unsubscribed: boolean = false

  map<TResult>(selector: (value: T) => TResult): Observable<TResult> {
    let observable = new BasicSubject<TResult>()
    let self = this

    // TODO: This is very hacky... but wait until RX 3 for proper solution
    let onNext = observable.next
    let onError = observable.error
    let onCompleted = observable.complete

    this.subscribe({
      next(value: T): void {
        onNext.call(observable, selector(value))
      },
      error(exception: any): void {
        onError.call(observable, exception)
      },
      complete(): void {
        onCompleted.call(observable)
      }
    })

    observable.next = this.next.bind(this)
    observable.error = this.error.bind(this)
    observable.complete = this.complete.bind(this)

    return observable
  }

  next(value: T) {
    if (!this.unsubscribed) {
      this.observers.forEach(function(observer) {
        observer.next(value)
      })
    }
  }

  error(e) {
    if (!this.unsubscribed) {
      this.observers.forEach(function(observer) {
        observer.error(e)
      })
    }
  }

  complete() {
    if (!this.unsubscribed) {
      this.observers.forEach(function(observer) {
        observer.complete()
      })
    }
  }

  subscribe(observer: Observer<T>): () => void {
    if (!this.unsubscribed) {
      this.observers.push(observer)
    }

    let self = this
    return function() {
      self.unsubscribed = true
      self.observers = []
    }
  }
}

export class BasicPromise<T> implements Promise<T> {
  private value: T
  private error: any
  constructor(value: T, error?: any) {
    if (Array.isArray(value)) {
      value = <any>xdmp.arrayValues(<any>value)
    }
    this.value = value
    this.error = error
  }
  then<TResult>(onfulfilled?: (value: T) => TResult | Promise<TResult>, onrejected?: (reason: any) => TResult | Promise<TResult>): Promise<TResult> {
    return this._then(onfulfilled, onrejected, true)
  }
  _then<TResult>(onfulfilled?: (value: T) => TResult | Promise<TResult>, onrejected?: (reason: any) => TResult | Promise<TResult>, convertArrays?: boolean): Promise<TResult> {
    try {
      if (this.value !== undefined) {
        if (onfulfilled) {
          let value = this.value
          if (convertArrays && value instanceof ValueIterator) {
            // TODO: This is an imperfect "hack", to be honest. It's here to make MarkScript uServices work as expected (and fit the type
            // system). Im not sure of the right approach in a purely javascript land, although once typescript-templates is working, we
            // could do type analysis to perform better code conversion (i.e.: change the user's code, not the value)
            value = <any>(<ValueIterator<any>><any>value).toArray().map(function(obj){
              if (obj.root && obj.root.toObject) {
                return obj.root.toObject()
              } else if (obj.toObject) {
                return obj.toObject()
              } else {
                return obj
              }
            })
          }

          let ret = onfulfilled(value)
          if (ret && (<Promise<any>>ret).then) {
            return <Promise<any>>ret
          } else {
            return new BasicPromise(ret)
          }
        } else {
          return <Promise<any>>this
        }
      } else {
        if (onrejected) {
          let ret = onrejected(this.error)
          if (ret && (<Promise<any>>ret).then) {
            return <Promise<any>>ret
          } else {
            return new BasicPromise(ret)
          }
        } else {
          return <Promise<any>>this
        }
      }
    } catch (e) {
      return new BasicPromise(undefined, e)
    }
  }

  catch(onrejected?: (reason: any) => T | Promise<T>): Promise<T> {
    if (this.error) {
      try {
        let ret = onrejected(this.error)
        if (ret && (<Promise<any>>ret).then) {
          return <Promise<any>>ret
        } else {
          return new BasicPromise(ret)
        }
      } catch (e) {
        return new BasicPromise(undefined, e)
      }
    } else {
      return this
    }
  }
}

export class RemoteProxy {
  constructor(uri: string, options: { [key: string]: string }) {
    this.uri = uri
    this.options = options || {}
  }

  private uri: string
  private options: { [key: string]: string }

  invokeMethod<T>(methodName, ...args: any[]): Promise<T> {
    let ret = xdmp.httpPost(this.uri + '-' + methodName, this.options, args).toArray()
    let status = <MLNodeAndObject<{ code: number, message: string }>>ret[0]

    if (status.code === 200) {
      let value = ret[1].toObject()
      return resolve(value)
    } else {
      return reject(status.message)
    }
  }
}

export class HttpObserver implements Observer<any> {
  constructor(uri: string, options: { [key: string]: string }) {
    this.uri = uri
    if (this.uri.indexOf('://') === -1) {
      this.uri = 'http://' + this.uri
    }
    this.options = options || {}
  }

  private uri: string
  private options: { [key: string]: string }

  next(value: any): void {
    xdmp.httpPost(this.uri, this.options, { value: value })
  }
  error(exception: any): void {
    xdmp.httpPost(this.uri, this.options, { error: exception })
  }
  complete(): void {
  }
}
