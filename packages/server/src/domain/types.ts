import { pipe } from 'fp-ts/function'
import * as S from 'fp-ts/string'
import * as E from 'fp-ts/Either'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as ioD from 'io-ts/Decoder'
import * as ioE from 'io-ts/Encoder'
import * as ioC from 'io-ts/Codec'

import { ALPHABET, WORD_LENGTH, VALID_GUESSES } from '../constants'
import * as u from '../utils'

/* --- A non empty string is a string with at least one non whitespace character --- */
interface NonEmptyStringBrand { readonly NonEmptyString: unique symbol }
export type NonEmptyString = string & NonEmptyStringBrand
export const NonEmptyString: ioD.Decoder<unknown, NonEmptyString> = pipe(
    ioD.string,
    ioD.refine((s): s is NonEmptyString => !S.isEmpty(s), 'NonEmptyString'),
)

export const NumberToNonEmptyString: ioE.Encoder<NonEmptyString, number> = {
    encode: n => {
        const s = String(n)
        const e = NonEmptyString.decode(s)
        return u.unsafeGet(e) // Safe here
    },
}

/* --- Check the length of a value --- */
interface FixedLengthBrand<N extends number> { readonly FixedLength: unique symbol; readonly length: N }
interface HasLength { length: number }
export type FixedLength<T extends HasLength, N extends number> = 
(N extends 0
    ? T
    : T extends ReadonlyArray<infer U>
        ? Readonly<T> & RNEA.ReadonlyNonEmptyArray<U>
    : T extends string
        ? T & NonEmptyString
    : T
) & FixedLengthBrand<N>
export const FixedLengthP: <T extends HasLength, N extends number>(l: N) => ioD.Decoder<T, FixedLength<T, N>> = 
    <N extends number, T extends HasLength>(l: N) => ioD.fromRefinement((t: T): t is FixedLength<T, N> => t.length === l, 'FixedLength')

/* --- A char is a non empty string of length 1 --- */
export type Char = FixedLength<NonEmptyString, 1>
export const Char: ioD.Decoder<NonEmptyString, Char> = FixedLengthP<NonEmptyString, 1>(1)

/* --- A letter is a char in the range of a to z and A to Z --- */
interface LetterBrand { readonly Letter: unique symbol } 
export type Letter = Char & LetterBrand 
export const Letter: ioD.Decoder<Char, Letter> = ioD.fromRefinement((c): c is Letter => /^[a-zA-Z]$/.test(c), 'Letter')

/* --- Check if a string is in lowercase --- */
interface LowercaseBrand { readonly Lowercase: unique symbol }
export type Lowercase<S extends string> = S & LowercaseBrand
const LowercaseR = <S extends string>(s: S): s is Lowercase<S> => S.toLowerCase(s) === s
export const LowercaseP: <S extends string>() => ioD.Decoder<S, Lowercase<S>> = () => ioD.fromRefinement(LowercaseR, 'Lowercase')

/* --- Safe conversion a non empty string to a char array --- */
export const NonEmptyStringToCharsP: <S extends NonEmptyString>() => ioE.Encoder<RNEA.ReadonlyNonEmptyArray<Char>, S> = () => ({ 
    encode: (nes) => {
        const s = S.split('')(nes)
        const d = ioD.compose(Char)(NonEmptyString)
        const es = RNEA.map(d.decode)(s)
        const e = RNEA.sequence(E.Applicative)(es)
        return u.unsafeGet(e) // Safe here
    }
})

/* --- A word is a non empty string where the first char is a letter and the rest are lowercase letters --- */
interface WordBrand { readonly Word: unique symbol }
export type Word = NonEmptyString & WordBrand
export const Word: ioD.Decoder<NonEmptyString, Word> = ioD.fromRefinement((nes): nes is Word => {
    const chars = NonEmptyStringToCharsP().encode(nes)
    const [[head], tail] = RNEA.splitAt(1)(chars)
    const h = Letter.decode(head)
    const t = tail.map(char => {
        const LowercaseLetter = pipe(Letter, ioD.compose(LowercaseP<Letter>()))
        return LowercaseLetter.decode(char)
    })
    const e = RNEA.sequence(E.Applicative)([h, ...t])
    return E.isRight(e)
}, 'Word')

/* --- A valid Guess is a lowercase word of length `WORD_LENGTH` included in `VALID_GUESSES` list --- */
interface ValidGuessBrand { readonly ValidGuess: unique symbol }
export type ValidGuess = FixedLength<Word, typeof WORD_LENGTH> & ValidGuessBrand
export const ValidGuess: ioD.Decoder<unknown, ValidGuess> = pipe(
    NonEmptyString,
    ioD.compose(Word),
    ioD.compose(LowercaseP()),
    ioD.compose(FixedLengthP(WORD_LENGTH)),
    ioD.refine((s: Word): s is ValidGuess => VALID_GUESSES.includes(s), 'ValidGuess'),
)

/* --- A solution is a valid guess contained in the `WORDS` list --- */
interface SolutionBrand { readonly Solution: unique symbol }
export type Solution = ValidGuess & SolutionBrand

/* --- An integer is whole number --- */
interface IntegerBrand { readonly Integer: unique symbol }
export type Integer = number & IntegerBrand
export const Integer: ioD.Decoder<number, Integer> = ioD.fromRefinement((n): n is Integer => Number.isInteger(n), 'Integer')

/* --- Check if the number is positive --- */
interface PositiveBrand { readonly Positive: unique symbol }
export type Positive<N extends number> = N & PositiveBrand
export const PositiveP: <N extends number>() => ioD.Decoder<number, Positive<N>> = 
    <N extends number>() => ioD.fromRefinement((n): n is Positive<N> => n > 0, 'Positive')

/* --- A letter position is the position of a letter in the alphabet --- */
interface LetterPositionBrand { readonly LetterPosition: unique symbol }
export type LetterPosition = Positive<Integer> & LetterPositionBrand
export const LetterPosition: ioD.Decoder<number, LetterPosition> = ioD.fromRefinement((n): n is LetterPosition => 1 <= n && n <= 26, 'LetterPosition')

/* --- Safe conversion from a valid guess to a decomposed valid word --- */
export const ValidGuessToDecomposedValidWord: ioE.Encoder<DecomposedValidWord, ValidGuess> = {
    encode: guess => {
        const letters = S.split('')(guess)
        return RNEA.map((l: string) => ALPHABET.indexOf(l) + 1)(letters) as DecomposedValidWord // Safe here
    }
}

/* --- A decomposed valid word is an array of length `WORD_LENGTH` of letter positions --- */
interface DecomposedValidWordBrand { readonly DecomposedValidWord: unique symbol }
export type DecomposedValidWord = FixedLength<RNEA.ReadonlyNonEmptyArray<LetterPosition>, typeof WORD_LENGTH> & DecomposedValidWordBrand
export const DecomposedValidWord: ioD.Decoder<unknown, DecomposedValidWord> = pipe(
    ValidGuess,
    ioD.parse(guess => {
        const decomposed = ValidGuessToDecomposedValidWord.encode(guess)
        return ioD.success(decomposed)
    })
)

/* --- A digit is a char in the range of 0 to 9 --- */
interface DigitBrand { readonly Letter: unique symbol } 
export type Digit = Char & DigitBrand 
export const Digit: ioD.Decoder<Char, Digit> = ioD.fromRefinement((c): c is Digit => /^[0-9]$/.test(c), 'Digit')

/* --- A string number is a sequence of digits --- */
interface StringNumberBrand { readonly StringNumber: unique symbol }
export type StringNumber = NonEmptyString & StringNumberBrand
export const StringNumber: ioD.Decoder<NonEmptyString, StringNumber> = ioD.fromRefinement((nes): nes is StringNumber => {
    const chars = NonEmptyStringToCharsP().encode(nes)
    const digits = RNEA.map(Digit.decode)(chars)
    const e = RNEA.sequence(E.Applicative)(digits)
    return E.isRight(e)
}, 'StringNumber')

/* --- A word hash is the MIMCSponge base 10 string representation of a stringified decomposed word --- */
interface WordHashBrand { readonly WordHash: unique symbol }
export type WordHash = StringNumber & WordHashBrand
export const WordHash: ioD.Decoder<unknown, WordHash> = pipe(
    NonEmptyString,
    ioD.compose(StringNumber as ioD.Decoder<NonEmptyString, WordHash>), // Careful here
)

/* --- A hint is a number between 0 and 2 where 0 means the corresponding letter isn't in the solution, 1 it is but in the wrong position and 2 means it is well places --- */
interface HintBrand { readonly Hint: unique symbol }
export type Hint = number & HintBrand
const HintD: ioD.Decoder<unknown, Hint> = pipe(
    ioD.number,
    ioD.refine((n): n is Hint => 0 <= n && n <= 2, 'Hint'),
)
export const Hint: ioC.Codec<unknown, NonEmptyString, Hint> = ioC.make(HintD, NumberToNonEmptyString)

/* --- Hints are a list of hint of length `WORD_LENGTH` --- */
interface HintsBrand { readonly Hints: unique symbol }
export type Hints = FixedLength<RNEA.ReadonlyNonEmptyArray<Hint>, typeof WORD_LENGTH> & HintsBrand
export const Hints: ioD.Decoder<unknown, Hints> = pipe(
    ioD.array(ioD.number),
    ioD.compose(FixedLengthP(WORD_LENGTH)),
    ioD.refine((a): a is Hints => {
        const r = RNEA.map(Hint.decode)(a)
        const e = RNEA.sequence(E.Applicative)(r)
        return E.isRight(e)
    }, 'Hints'),
)