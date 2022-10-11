import React, { useState } from 'react'

const ResponseTime = ({maxDistance=3, roomArea=30, roomHeight=3, growthRate= 0.0117, rTI=50, tActive=68}) => {
    const [safetyFactor, setSafetyFactor] = useState({
        multiple: 2,
        percentage: 20,
    })
    
    
    const flameHeight = 2.25;

    //  constants: 
    const tAmb = 293;
    const E = 0.20; // not sure what this is??
    const g = 9.81;
    const rho = 1.1;
    const cp = 1.04;

    // smoke layer functions
    // todo: import functions from other page
    function computeQ(elapsedTime, growthRate) {
        if (elapsedTime == 0 ) {
            return 0;
        } else {
            return growthRate*(elapsedTime**2);
        }
    }

    function computeQC(q) {
        return q*0.7
    }

    function computeMEntropy(z, g, prevRhoUpper, cP, tAmb, qC) {
        return (
            E * ((g*(prevRhoUpper**2) / 
            (cP*tAmb))**(1/3))*((qC**(1/3))*(z**(5/3))) || 0) 
    }

    function computeRhoUpper(tAmb, tUpper) {
        return rho * ( tAmb / tUpper )
    }

    function computeMUpper(mEntropy, prevMUpper) {
        return mEntropy + prevMUpper
    }

    function computeTUpper(tSmoke, prevTUpper, mEntropy, mUpper
        ) {
        let tUpper = ((((tSmoke - prevTUpper)*mEntropy) / (mEntropy + mUpper)) || 0) + prevTUpper
        return tUpper
    }

    function computeTSmoke(qC, mEntropy) {
        let LHS = qC/(mEntropy*cp)
        if (qC == 0) {
            LHS = 0
        }
        return LHS + tAmb
    }

    function computeZ(prevZ, deltaH) {
        return prevZ - deltaH
    }

    function computeDeltaH(mEntropy, rhoUpper, area) {
        let deltaH = mEntropy/(rhoUpper*area)
        return Number.isFinite(deltaH) ? deltaH : 0;
    }

    function computeUpperDepth(deltaH, prevSmokeLayerDepth) {
        // debugger;
        return deltaH + prevSmokeLayerDepth
    }

    // sprinkler activation functions
    function computeU(r, H, q) { //u: jet velocity
        let u = null
        if (r/H > 0.15) {
            u = 0.195*(q**(1/3))*(H**(1/2))/(r**(5/6))
        } else {
            u = 0.96*((q/H)**(1/3))
        }
        return u
    }

    function computeDeltaTdetector(u, tUpper, prevTDetector) {
        return ((u**(1/2))*(tUpper - prevTDetector))/rTI
    }

    function computeTDetector(prevTDetector, deltaTDetector) {
        return prevTDetector + deltaTDetector
    }

    // add time to hashmap; if hashmap not full
    function checkIfActivated(tDetector, tActive, activated=false) {
        let tC = convertKelvinToCelsius(tDetector)
        if (tC >= tActive) {
            activated = true
        } 
        return activated
    }

    function computeActivationTime() {
        // Question: should all values be stored, even after activation?
        let activated = false
        let tDetector= tAmb 
        let currentTDetector = null
        let time = 0
        let currentTime = null
        let activatedArray = [];
        let deltaTDetector = null;
        let u = null;
        let q, qc, tSmoke, deltaH = null;
        let tUpper = 273; // why zero, not tAmb??
        let z = roomHeight;
        let rhoUpper = rho.toFixed(2); // always 1.1
        let h = 0; // smoke layer depth
        let mUpper = 0;
        let mEntropy = 0;
        console.log(tDetector, currentTDetector, time, currentTime)
        while (!activated) {

            activated = checkIfActivated(tDetector, tActive, activated)
            currentTime= time
            currentTDetector = tDetector
            // console.log(currentTime, currentTDetector)
            // // functions to get other values below
            // // smoke layer functions
            q = computeQ(time, growthRate) 
            qc = computeQC(q)
            mUpper = computeMUpper(mEntropy, mUpper)
            mEntropy = computeMEntropy(z, g, rhoUpper, cp, tAmb, qc)
            tSmoke = computeTSmoke(qc, mEntropy)
            
            tUpper = computeTUpper(tSmoke, tUpper, mEntropy, mUpper
                )
            rhoUpper = computeRhoUpper(tAmb, tUpper)
            
            deltaH = computeDeltaH(mEntropy, rhoUpper, roomArea) // hardcoded room area

            z = computeZ(z, deltaH)
            // smokeLayerDepth: h
            h = computeUpperDepth(deltaH, h)
            
            // // sprinkler functions
            u = computeU(maxDistance, h, q)
            
            deltaTDetector = computeDeltaTdetector(u, tUpper, tDetector)
            tDetector = computeTDetector(tDetector, deltaTDetector)
            // debugger;
            time += 1
            // tDetector += 25
        }
        console.log("tripped values: ",currentTime, currentTDetector)
        return currentTime
    } 

    function convertKelvinToCelsius(tempK) {
        return tempK - 273
    }

    function computeHeatReleaseRate(growthRate, t) {
        return growthRate*t**2
    }

    let activationTime = computeActivationTime()
    let activationHRR = computeHeatReleaseRate(growthRate, activationTime)
    let hRRMultipliedBySafetyFactor = activationHRR * safetyFactor.multiple 
    let safetyHRRPercentage = (safetyFactor.multiple*100)+safetyFactor.percentage 

    // TODO: add ability to change factor of safety

    function handleInput(event) {
        setSafetyFactor(prev => ({
          ...prev,
          [event.target.name] : event.target.value
        })
          )
    
      }

  return (
    <>
        {activationTime ? `Activation Time: ${activationTime} seconds` : null}
        <br />
        <br />
        {`HRR on activation: ${activationHRR.toFixed(2)}kW`}
        
        <form>
          <label>{`Factor of Safety: `}
            <input
              type="text" 
              name='multiple'
              value={safetyFactor.multiple}
              onChange={handleInput}
            />
            {`x`}
          </label>
          <br />
          {`${safetyFactor.multiple}x HRR on activation: ${hRRMultipliedBySafetyFactor.toFixed(2)}kW`}
          <br />
          <label>{`Additional Factor of Safety: `}
            <input
              type="text" 
              name='percentage'
              value={safetyFactor.percentage}
              onChange={handleInput}
            />
            {`%`}
          </label>
          <br />
          {`${safetyHRRPercentage}% HRR on activation: ${((safetyHRRPercentage/100)*activationHRR).toFixed(2)}kW`}

        </ form>
    </>
  )
}

export default ResponseTime