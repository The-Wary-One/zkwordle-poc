import * as path from 'path'
import { wasm } from 'circom_tester'
import { buildMimcSponge } from 'circomlibjs'

describe('wordle.circom', () => {
    
    it('should produce valid hints', async () => {
        const circuit = await wasm(path.join(__dirname, '../templates/wordle.circom'))
        const solution = [20, 18, 5, 1, 20] // treat
        const hasher = await buildMimcSponge()
        const hash = hasher.multiHash(solution, 5, 1);
        const solutionHash = hasher.F.toString(hash, 10)

        const w = await circuit.calculateWitness({
            guess: [1, 18, 19, 5, 19],  // arses
            solutionHash, 
            solution,
        })
        await circuit.checkConstraints(w)
        await circuit.assertOut(w, { out: [1, 2, 0, 1, 0] })

        const w2 = await circuit.calculateWitness({
            guess: [20, 18, 1, 9, 14],  // train
            solutionHash, 
            solution,
        })
        await circuit.checkConstraints(w2)
        await circuit.assertOut(w2, { out: [2, 2, 1, 0, 0] })

        const w3 = await circuit.calculateWitness({
            guess: [20, 18, 5, 1, 20], // treat
            solutionHash, 
            solution,
        })
        await circuit.checkConstraints(w3)
        await circuit.assertOut(w3, { out: [2, 2, 2, 2, 2] })
    })
})
