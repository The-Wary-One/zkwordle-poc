const Path = require('path')

const WitnessCalculator = require('./wordle_js/witness_calculator.js')

const WASM_PATH = Path.join(__dirname, 'wordle_js/wordle.wasm')
const ZKEY_PATH = Path.join(__dirname, 'wordle_final.zkey')

module.exports = {
    WitnessCalculator,
    WASM_PATH,
    ZKEY_PATH,
}