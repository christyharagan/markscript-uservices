declare interface Observer<T> {
  /**
   * Recieves the next value in the sequence
   */
  next(value: T)

  /**
   * Recieves the sequence error
   */
  error(errorValue)

  /**
   * Receives the sequence completion value
   */
  complete(completeValue?: T)
}

declare interface Observable<T> {
  /**
   * Subscribes to the sequence
   */
  subscribe(observer: Observer<T>): () => void

  // TODO
  // /**
  //  * Subscribes to the sequence with a callback, returning a promise
  //  */
  // forEach(onNext: (T) => any): Promise

  /**
   * Standard combinators
   */

  // TODO
  // filter(callback: (T) => boolean): Observable<T>
  map<U>(callback: (T) => U): Observable<U>
}
