import {DatabaseClient, ResultProvider} from 'marklogic'
import * as u from 'uservices'
import * as m from './model'

export interface Server {
  get(path: string): u.Observable<any>

  post(path: string): u.Observable<any>

  put(path: string): u.Observable<any>

  del(path: string): u.Observable<any>
}

export function createRemoteProxy<T>(service: m.MLService, client: DatabaseClient, server: Server): T {
  let proxy: any = {}
  u.visitService(service, {
    onMethod: function(method) {
      proxy[method.name] = function(...args: any[]) {
        return new Promise(function(resolve, reject){
          let resultProvider:ResultProvider<any>
          switch (m.methodToString((<m.MLMethod>method).method)) {
            // case 'GET':
            // case 'DELETE':
            case 'PUT':
              resultProvider = client.resources.put(service.name + '-' + method.name, {}, JSON.stringify(args))
              break
            case 'POST':
              resultProvider = client.resources.post(service.name + '-' + method.name, {}, JSON.stringify(args))
              break
          }
          resultProvider.result(function(value) {
            if (Array.isArray(value)) {
              resolve(value.map(function(v) {
                return v.content
              }))
            } else {
              resolve(value)
            }
          }, reject)
        })
      }
    },
    onEvent: function(event) {
      let observable = server.post('/' + service.name + '-' + event.name).map(function(value) {
        if (value.value) {
          return value.value
        } else {
          throw value.error
        }
      })
      proxy[event.name] = function() {
        return observable
      }
    }
  })
  return <T>proxy
}
