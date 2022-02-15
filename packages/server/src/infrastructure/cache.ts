import LRUCache, * as lru from 'lru-cache'
import * as T from 'fp-ts/Task'

interface LRUOptions<K, V> extends lru.Options<K, V> {
    customCache?: boolean
}
export const createCache = <K, V>(opts: LRUOptions<K, V>) => new LRUCache(opts)
const defaultCache = createCache({
    max: 20000,
})
export function memoize<
    K,
    F extends (...a: any[]) => T.Task<any>,
    V extends (ReturnType<F> extends T.Task<infer U> ? U : ReturnType<F>),
    A extends Parameters<F> = Parameters<F>,
>(
    fn: F, 
    cacheKeyFn: (...args: A) => K,
    ttlFn?: () => number,
    cacheOpts?: LRUOptions<K, V>,
) {
    const cache = cacheOpts?.customCache ? createCache(cacheOpts) : defaultCache

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