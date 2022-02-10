import * as E from 'fp-ts/Either'
import * as ioD from 'io-ts/Decoder'
import { GraphQLScalarType } from 'graphql'
import { JSONObjectResolver } from 'graphql-scalars'

import * as d from '../domain'

export type ID = string
export type String = string
export type Boolean = boolean
export type Int = d.Integer
export type Float = number

export type JSONObject = Readonly<Record<string, unknown>>
export const JSONObject = JSONObjectResolver

const unsafeValidateType = <T>(decoder: ioD.Decoder<unknown, T>) => (u: unknown): T => {
    const e = decoder.decode(u)
    if (E.isLeft(e)) {
        throw new TypeError(ioD.draw(e.left))
    }
    return e.right
}

export type NonEmptyString = d.NonEmptyString
export const NonEmptyString = new GraphQLScalarType<d.NonEmptyString, string>({
    name: 'NonEmptyString',
    description: 'A non empty string is a string with at least one non whitespace character',
    serialize: unsafeValidateType(d.NonEmptyString),
    parseValue: unsafeValidateType(d.NonEmptyString),
    parseLiteral(ast) {
        const value = 'value' in ast ? ast.value : undefined
        return unsafeValidateType(d.NonEmptyString)(value)
    },
    extensions: {
        codegenScalarType: 'string',
    }
})

export type ValidGuess = d.ValidGuess
export const ValidGuess = new GraphQLScalarType<d.ValidGuess, string>({
    name: 'ValidGuess',
    description: 'A valid Guess is a lowercase word of length `WORD_LENGTH` included in `VALID_GUESSES` list',
    serialize: unsafeValidateType(d.ValidGuess),
    parseValue: unsafeValidateType(d.ValidGuess),
    parseLiteral(ast) {
        const value = 'value' in ast ? ast.value : undefined
        return unsafeValidateType(d.ValidGuess)(value)
    },
    extensions: {
        codegenScalarType: 'string',
    }
})

export type WordHash = d.WordHash
export const WordHash = new GraphQLScalarType<d.WordHash, string>({
    name: 'WordHash',
    description: 'A word hash is the MIMCSponge base 10 string representation of a stringified decomposed word',
    serialize: unsafeValidateType(d.WordHash),
    parseValue: unsafeValidateType(d.WordHash),
    parseLiteral(ast) {
        const value = 'value' in ast ? ast.value : undefined
        return unsafeValidateType(d.WordHash)(value)
    },
    extensions: {
        codegenScalarType: 'string',
    }
})