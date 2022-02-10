pragma circom 2.0.3;

include "./range.circom";
include "../../../node_modules/circomlib/circuits/mimcsponge.circom";

/* 
    Wordle circom template
    
    It takes as parameter the word length

    It takes as inputs:
        1. a word (i.e. guess) as an array of integers from 1 to 26 (i.e. 'a' to 'z')
        2. the mimc(5, 220, 1) hash of the array of integers representing the word to guess
        3. the array of integers representing the word to guess (i.e. the solution)
    
    It:
        1. Checks if all integer inputs are in range
        2. Hashes the solution and checks it against the hash input
        3. Calculates and returns the hint
    
    It outputs the hint as an array of integers of 0 (i.e. if the letter is not present in the solution), 1 (i.e. if the letter is present but not at this position) and 2 (i.e. if the letter is at the correct position)
*/
template Wordle(l) {

    signal input guess[l];
    signal input solutionHash;
    signal input solution[l];
    signal output out[l];
    
    // 1
    component range = InclusiveMultiRangeProof(2 * l, 32);
    range.l <== 1;
    range.h <== 26;
    for (var i = 0; i < l; i++) {
        range.x[i] <== solution[i];
    }
    for (var i = 0; i < l; i++) {
        range.x[i + l] <== guess[i];
    }
    
    // 2
    component hasher = MiMCSponge(l, 220, 1);
    hasher.k <== l;
    for (var i = 0; i < l; i++) {
        hasher.ins[i] <== solution[i];
    }

    solutionHash === hasher.outs[0];

    // 3. Unoptimized
    // First mark the right positioned letters
    var g[l] = guess;
    var hint[l];
    for (var i = 0; i < l; i++) {
        if (g[i] == solution[i]) {
            hint[i] = 2;
            // To avoid double counting present letters
            g[i] = 0;
        }
    }
    // Then mark the present letters
    for (var i = 0; i < l; i++) {
        for (var j = 0; j < l; j++) {
            if (g[i] == solution[j]) {
                hint[i] = 1;
                // To avoid double counting
                g[j] = 0;
            }
        }
        out[i] <-- hint[i];
    }
}

component main { public [guess, solutionHash] } = Wordle(5);