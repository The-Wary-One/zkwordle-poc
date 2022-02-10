import * as T from 'fp-ts/Task'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'

import * as d from '../domain'
import { zk, cache } from '../infrastructure'
import { WORD_LENGTH } from '../constants'
import * as u from '../utils'

function extractHintsFromPublicSignals(s: zk.ZKPayload['publicSignals']): d.Hints {
    const [h] = RNEA.splitAt(WORD_LENGTH)(s)
    const e = d.Hints.decode(h)
    return u.unsafeGet(e) // Safe here
}

export default async function init() {
    const hashDecomposedWord = await zk.setupMimcSponge()

    function getCurrentWordHash(): d.WordHash {
        const solution = d.getSolution()
        const decomposedSolution = d.ValidGuessToDecomposedValidWord.encode(solution)
        return hashDecomposedWord(decomposedSolution)
    }
    const memoizedGetCurrentWordHash = cache.memoize(
        {
            max: 1,
            ttl: d.msUntilNextWord(),
        },
        () => T.of(getCurrentWordHash()),
        () => 'wordhash',
    )

    type ZKHintPayload = Readonly<zk.ZKPayload & { hints: d.Hints }>

    const calculateHintWithProofFromGuess = (guess: d.ValidGuess): T.Task<ZKHintPayload> => async () => {
        const inputs: zk.ZKInputs = {
            guess: d.ValidGuessToDecomposedValidWord.encode(guess),
            solutionHash: getCurrentWordHash(),
            solution: d.getSolution(),
        }
        const { proof, publicSignals } = await zk.plonkFullProve(inputs)()
        const hints = extractHintsFromPublicSignals(publicSignals)
        return {
            hints,
            proof,
            publicSignals,
        }
    }
    const memoizedCalculateHintWithProofFromGuess = cache.memoize(
        {
            max: 10000,
        },
        calculateHintWithProofFromGuess,
        guess => guess,
        d.msUntilNextWord,
    )

    return {
        getCurrentWordHash: memoizedGetCurrentWordHash,
        calculateHintWithProofFromGuess: memoizedCalculateHintWithProofFromGuess,
    }
}