pragma circom 2.0.3;

include "../../../node_modules/circomlib/circuits/comparators.circom";

template InclusiveRangeProof(nBits) {

    signal input l; // e.g. 1
    signal input h; // e.g. 26
    signal input x; // e.g. 5
    signal output out; // "boolean" (i.e. 0 == false, 1 == true)

    component lessThan1 = LessThan(nBits);
    component lessThan2 = LessThan(nBits);

    // l <= x
    lessThan1.in[0] <== l;
    lessThan1.in[1] <== x + 1;
    var isGreaterOrEqThanL = lessThan1.out;
    // x <= h
    lessThan2.in[0] <== x;
    lessThan2.in[1] <== h + 1;
    var isLowerOrEqThanH = lessThan2.out;
    // l <= x && x <= h
    out <== isGreaterOrEqThanL * isLowerOrEqThanH;
    out === 1;
}

template InclusiveMultiRangeProof(len, nBits) {
    
    signal input l;
    signal input h;
    signal input x[len];

    component range[len];
    // Check if every n is in range and reduce the results to 1 output
    for (var i = 0; i < len; i++) {
        range[i] = InclusiveRangeProof(nBits);
        range[i].l <== l;
        range[i].h <== h;
        range[i].x <== x[i];
    }
}