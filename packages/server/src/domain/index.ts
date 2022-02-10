import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'

import * as t from './types'
import * as c from '../constants'
import * as u from '../utils'

export * from './types'

export type toTuple<T extends t.FixedLength<RNEA.ReadonlyNonEmptyArray<any>, number>> = T extends t.FixedLength<RNEA.ReadonlyNonEmptyArray<infer U>, infer N>
    ? u.Tuple<U, N>
    : never

export function getSolution(): t.Solution {
    const now = Date.now()
    const index = Math.floor((now - c.GAME_EPOCH_MS) / c.GAME_TICK_MS)
    return c.WORDS[index % c.WORDS.length] as t.Solution // Only allowed location
}

export function msUntilNextWord() {
    const now = Date.now()
    const nextWordAt = new Date(now)
    nextWordAt.setUTCHours(0, 0, 0, 0)
    nextWordAt.setUTCDate(nextWordAt.getUTCDate() + 1)
    return nextWordAt.getTime() - now
}