import * as constants from './constants'

// smoke layer functions
export function computeQ(elapsedTime, growthRate) {
    if (elapsedTime == 0 ) {
        return 0;
    } else {
        return growthRate*(elapsedTime**2);
    }
}

export function computeQC(q) {
    return q*0.7
}

export function computeMEntropy(z, g, prevRhoUpper, cP, tAmb, qC) {
    return (
        E * ((g*(prevRhoUpper**2) / 
        (cP*tAmb))**(1/3))*((qC**(1/3))*(z**(5/3))) || 0) 
}

export function computeRhoUpper(tAmb, tUpper) {
    return rho * ( tAmb / tUpper )
}

export function computeMUpper(mEntropy, prevMUpper) {
    return mEntropy + prevMUpper
}

export function computeTUpper(tSmoke, prevTUpper, mEntropy, mUpper
    ) {
    let tUpper = ((((tSmoke - prevTUpper)*mEntropy) / (mEntropy + mUpper)) || 0) + prevTUpper
    return tUpper
}

export function computeTSmoke(qC, mEntropy) {
    let LHS = qC/(mEntropy*cp)
    if (qC == 0) {
        LHS = 0
    }
    return LHS + tAmb
}

export function computeZ(prevZ, deltaH) {
    return prevZ - deltaH
}

export function computeDeltaH(mEntropy, rhoUpper, area) {
    let deltaH = mEntropy/(rhoUpper*area)
    return Number.isFinite(deltaH) ? deltaH : 0;
}

export function computeUpperDepth(deltaH, prevSmokeLayerDepth) {
    return deltaH + prevSmokeLayerDepth
}

// sprinkler activation functions
export function computeU(r, H, q) { //u: jet velocity
    let u = null
    if (r/H > 0.15) {
        u = 0.195*(q**(1/3))*(H**(1/2))/(r**(5/6))
    } else {
        u = 0.96*((q/H)**(1/3))
    }
    return u
}

export function computeDeltaTdetector(u, tUpper, prevTDetector, rTI) {
    return ((u**(1/2))*(tUpper - prevTDetector))/rTI
}

export function computeTDetector(prevTDetector, deltaTDetector) {
    return prevTDetector + deltaTDetector
}

// add time to hashmap; if hashmap not full
export function checkIfActivated(tDetector, tActive, activated=false) {
    let tC = convertKelvinToCelsius(tDetector)
    if (tC >= tActive) {
        activated = true
    } 
    return activated
}

export function computeActivationTime(maxDistance, roomArea, roomHeight, rTI, tActive) {
    // Question: should all values be stored, even after activation?
    let activated = false
    let tDetector= constants.tAmb 
    let currentTDetector = null
    let time = 0
    let currentTime = null
    let activatedArray = [];
    let deltaTDetector = null;
    let u = null;
    let q, qc, tSmoke, deltaH = null;
    let tUpper = 273; // why zero, not tAmb??
    let z = roomHeight;
    let rhoUpper = constants.rho.toFixed(2); // always 1.1
    let h = 0; // smoke layer depth
    let mUpper = 0;
    let mEntropy = 0;
    console.log(tDetector, currentTDetector, time, currentTime)
    while (!activated) {

        activated = checkIfActivated(tDetector, tActive, activated)
        currentTime= time
        currentTDetector = tDetector

        // // functions to get other values below
        // // smoke layer functions
        q = computeQ(time, growthRate) 
        qc = computeQC(q)
        mUpper = computeMUpper(mEntropy, mUpper)
        mEntropy = computeMEntropy(z, constants.g, rhoUpper, constants.cp, constants.tAmb, qc)
        tSmoke = computeTSmoke(qc, mEntropy)
        
        tUpper = computeTUpper(tSmoke, tUpper, mEntropy, mUpper
            )
        rhoUpper = computeRhoUpper(constants.tAmb, tUpper)
        
        deltaH = computeDeltaH(mEntropy, rhoUpper, roomArea)

        z = computeZ(z, deltaH)
        // smokeLayerDepth: h
        h = computeUpperDepth(deltaH, h)
        
        // // sprinkler functions
        u = computeU(maxDistance, h, q)
        
        deltaTDetector = computeDeltaTdetector(u, tUpper, tDetector, rTI)
        tDetector = computeTDetector(tDetector, deltaTDetector)

        time += 1
    }
    console.log("tripped values: ",currentTime, currentTDetector)
    return currentTime
} 

export function convertKelvinToCelsius(tempK) {
    return tempK - 273
}

export function computeHeatReleaseRate(growthRate, t) {
    return growthRate*t**2
}