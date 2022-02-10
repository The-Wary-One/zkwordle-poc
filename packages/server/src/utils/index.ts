import * as E from 'fp-ts/Either'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as ioD from 'io-ts/Decoder'

export function unsafeGet<T>(e: E.Either<ioD.DecodeError, T>): T {
    if (E.isLeft(e)) {
        throw new Error(ioD.draw(e.left))
    }
    return e.right
}

export type Tuple<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;