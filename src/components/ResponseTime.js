import React, { useState } from 'react'
import {computeActivationTime, computeHeatReleaseRate} from '../helpers/responseTimeUtils'


const ResponseTime = ({maxDistance=3, roomArea=30, roomHeight=3, growthRate= 0.0117, rTI=50, tActive=68}) => {
    const [safetyFactor, setSafetyFactor] = useState({
        multiple: 2,
        percentage: 20,
    })


    let activationTime = computeActivationTime(maxDistance, roomArea, roomHeight, growthRate, rTI, tActive)
    let activationHRR = computeHeatReleaseRate(growthRate, activationTime)
    let hRRMultipliedBySafetyFactor = activationHRR * safetyFactor.multiple 
    let safetyHRRPercentage = (safetyFactor.multiple*100)+safetyFactor.percentage 

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