import React, { useEffect, useState } from 'react'
import { CSVLink } from 'react-csv';
import {computeActivationTime, computeHeatReleaseRate} from '../helpers/responseTimeUtils'
import {findRandomPointInArea, computeMaxDistanceFromPoint, computeSprinklersNeeded, computeRectArea} from '../helpers/sprinklerLayoutUtils'
import {monteCarloSimInputData} from '../data/monteCarloSimInputs'


const MonteCarloSim = () => {
   
  const [csvData, setCsvData] = useState(null)

  useEffect(() => {
    setCsvData(monteCarloLoop())
  }, [])
    
    function monteCarloLoop() {
    const dataLength = monteCarloSimInputData.length
    const rTI = 285
    const tActive = 68

    let safetyFactor = {
      multiple: 2,
      percentage: 20,
  }

    const headers = ["roomArea", "roomWidth", "roomLength", "roomCeilingHeight", "growthRate", "rti", "tActive", "sprinklerLocations", "randomPoint", "distanceToSprinkler","activationTime", "activationHRR", "doubleActivationHRR"]
    let csvData = []
    csvData.push(headers)

    for (let i=0; i<dataLength; i++) {
      let currentRow = monteCarloSimInputData[i]
      let currentRoomArea = currentRow.room_area_array
      let currentRoomWidth = currentRow.width_array
      let currentRoomLength = currentRow.length_array
      let currentGrowthRate = currentRow.hrr_array
      let currentCeilingHeiht = currentRow.ceiling_height_array


      let [sprinklersMonteCarlo] = computeSprinklersNeeded(currentRoomArea, currentRoomWidth, currentRoomLength)
      let randomMonteCarloPoint = findRandomPointInArea(currentRoomWidth, currentRoomLength)
      let maxDMonteCarlo = computeMaxDistanceFromPoint(currentRoomWidth, currentRoomLength, sprinklersMonteCarlo, randomMonteCarloPoint)
      // calc hrr from maxD and growthRate
      let activationTime = computeActivationTime(maxDMonteCarlo, currentRoomArea, currentCeilingHeiht, currentGrowthRate, rTI, tActive)
      let activationHRR = computeHeatReleaseRate(currentGrowthRate, activationTime)
      let hRRMultipliedBySafetyFactor = activationHRR * safetyFactor.multiple 
      let safetyHRRPercentage = (safetyFactor.multiple*100)+safetyFactor.percentage
      let rowData = [currentRoomArea, currentRoomWidth, currentRoomLength, currentCeilingHeiht, currentGrowthRate, rTI, tActive, sprinklersMonteCarlo, randomMonteCarloPoint, maxDMonteCarlo, activationTime, activationHRR, hRRMultipliedBySafetyFactor]
      csvData.push(rowData) 
    }
    return csvData

  }
// TODO: Action mc sim on button press
  return (
    <>
      {(csvData) ? <CSVLink data={csvData} filename={"mcSimReport"} target={"_blank"} >Export MonteCarlo Sim to Csv</CSVLink>  : null}

    </>
  )
}

export default MonteCarloSim