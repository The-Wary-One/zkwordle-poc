import { makeExecutableSchema } from '@graphql-tools/schema'

import * as d from '../domain'
import applicationInit from '../application'
import { NonEmptyString, JSONObject, ValidGuess, WordHash } from './scalars'
import { Resolvers, Hint } from './generated'

const sdl = /* GraphQL */ `
directive @rateLimit(
    max: Int,
    window: String,
    message: String,
    identityArgs: [String],
    arrayLengthField: String
) on FIELD_DEFINITION 

"See https://www.graphql-scalars.dev/docs/scalars/non-empty-string"
scalar NonEmptyString
"See https://www.graphql-scalars.dev/docs/scalars/json-object"
scalar JSONObject
"A hash corresponding to a word"
scalar WordHash
"A valid lowercase word of the right length"
scalar ValidGuess

type Query {
    solutionHash: WordHash! @rateLimit(window: "5s", max: 1, message: "Too many calls!")
    validGuesses: [ValidGuess!]! @rateLimit(window: "5s", max: 1, message: "Too many calls!")
    guess(input: GuessInput!): GuessZKPayload!
}

input GuessInput {
    guess: ValidGuess!
}

type GuessZKPayload {
    "The hints"
    hints: [Hint!]!
    """
    The content of the public.json file required to verify the proof.
    It is composed by the hint, the guess and the wordHash.
    """
    publicSignals: [NonEmptyString!]!
    "The generated zk proof to verify"
    proof: JSONObject!
}

"A letter hint"
enum Hint {
    "The letter isn't in the word"
    Absent
    "The letter is in the wrong position"
    BadPosition
    "The letter is in the right position"
    GoodPosition
}
`

export default async function getSchema() {
    const { getCurrentWordHash, getValidGuesses, calculateHintWithProofFromGuess } = await applicationInit()

    const resolvers: Resolvers & { Hint: Record<string, Hint> } = {
        Query: {
            async solutionHash() {
                return getCurrentWordHash()()
            },
            validGuesses() {
                return getValidGuesses()()
            },
            async guess(_, args) {
                const { hints, proof, publicSignals } = await calculateHintWithProofFromGuess(args.input.guess)()
                const signals = publicSignals.map(s => typeof s === 'number'
                    ? d.NumberToNonEmptyString.encode(s)
                    : s
                )
                
                return {
                    hints,
                    publicSignals: signals,
                    proof,
                }
            },
        },
        NonEmptyString,
        JSONObject,
        ValidGuess,
        WordHash,
        Hint: {
            Absent: Hint.Absent,
            BadPosition: Hint.BadPosition,
            GoodPosition: Hint.GoodPosition,
        },
    }

    return makeExecutableSchema({
        typeDefs: sdl,
        resolvers,
    })
}