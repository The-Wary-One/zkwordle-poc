import * as Path from 'path'
import * as fs from 'fs/promises'
import { pipe } from 'fp-ts/lib/function'
import * as T from 'fp-ts/Task'
import * as E from 'fp-ts/Either'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as cjs from 'circomlibjs' 
import * as snarkjs from 'snarkjs'
import WitnessCalculator from './generated/witness_calculator'

import * as d from '../../domain'
import { WORD_LENGTH } from '../../constants'
import * as u from '../../utils'

const WASM_PATH = Path.join(__dirname, 'generated/wordle.wasm')
const ZKEY_PATH = Path.join(__dirname, 'generated/wordle_final.zkey')

export const setupMimcSponge: T.Task<(dw: d.DecomposedValidWord) => d.WordHash> = async () => {
    const mimcSponge = await cjs.buildMimcSponge()
    // With the strongly typed input, this function should not fail
    return dw => {
        const hash = mimcSponge.multiHash(dw, WORD_LENGTH, 1)
        const s = mimcSponge.F.toString(hash, 10)
        const e = d.WordHash.decode(s)
        return u.unsafeGet(e) // Safe here
    }
}

type PublicSignals = [...d.toTuple<d.Hints>, ...d.toTuple<d.DecomposedValidWord>, d.WordHash]
export type ZKPayload = Readonly<{
    publicSignals: PublicSignals,
    proof: Record<string, unknown>,
}>

export type ZKInputs = Readonly<{
    guess: d.DecomposedValidWord,
    solutionHash: d.WordHash,
    solution: d.Solution,
}>

// Every conversion done here are safe
export const plonkFullProve: (input: ZKInputs) => T.Task<ZKPayload> = input => async () => {
    const i = {
        ...input,
        solution: d.ValidGuessToDecomposedValidWord.encode(input.solution),
    }
    const buffer = await fs.readFile(WASM_PATH)
    const wc = await WitnessCalculator(buffer)
    const wtns = await wc.calculateWTNSBin(i, 0)

    const { proof, publicSignals } = await snarkjs.plonk.prove(ZKEY_PATH, wtns)
    const [h, rest] = RNEA.splitAt(WORD_LENGTH)(publicSignals as RNEA.ReadonlyNonEmptyArray<string>)
    const [g, [sh]] = RNEA.splitAt(WORD_LENGTH)(rest as RNEA.ReadonlyNonEmptyArray<string>)

    const hints = u.unsafeGet(pipe(
        h,
        RNEA.map(s => parseInt(s, 10)),
        RNEA.map(d.Hint.decode),
        RNEA.sequence(E.Applicative),
    )) as u.Tuple<d.Hint, typeof WORD_LENGTH>
    const guess = u.unsafeGet(pipe(
        g,
        RNEA.map(s => parseInt(s, 10)),
        RNEA.map(d.LetterPosition.decode),
        RNEA.sequence(E.Applicative),
    )) as u.Tuple<d.LetterPosition, typeof WORD_LENGTH>
    const hash = u.unsafeGet(d.WordHash.decode(sh))
    const p: PublicSignals = [...hints, ...guess, hash]

    return {
        proof,
        publicSignals: p,
    }
}