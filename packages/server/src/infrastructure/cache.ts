import LRUCache, * as lru from 'lru-cache'
import * as T from 'fp-ts/Task'

interface LRUOptions<K, V> extends lru.Options<K, V> {
    ttl?: number,
}
export const createCache = <K, V>(opts: LRUOptions<K, V>) => new LRUCache(opts)
export function memoize<
    K,
    F extends (...a: any[]) => T.Task<any>,
    V extends (ReturnType<F> extends T.Task<infer U> ? U : ReturnType<F>),
    A extends Parameters<F> = Parameters<F>,
>(
    cacheOpts: LRUOptions<K, V>,
    fn: F, 
    cacheKeyFn: (...args: A) => K,
    ttlFn?: () => number,
) {
    const cache = createCache(cacheOpts)

    return (...args: A): T.Task<V> => async () => {
        const key = cacheKeyFn(...args)
        const cachedValue = cache.get(key)
        
        if (cachedValue != null) {
            console.log('Value from cache')
            return cachedValue
        }
        
        const value = await fn(...args)()
        const ttl = ttlFn?.()
        cache.set(key, value, ttl && { ttl } as any)
        console.log('value cached')

        return value
    }
}