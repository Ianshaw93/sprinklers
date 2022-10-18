import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './App.css';
import ResponseTime from './components/ResponseTime';

function App() {
  const [calcData, setCalcData] = useState({
    width: 0,
    length: 0,
    height: 0,
    sprinklers: null,
    growthRate: 0.0117,
    rTI: 50,
    tActive: 68
  });

  const canvasRef = useRef(null); // allows props to component

  useEffect(() => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    // context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle=('blue');
    context.rect(0, 0, calcData.width, calcData.height);
    context.fill();
  
    // return () => {
    //   second
    // };
  }, [calcData])

  const growthRateObject = {
    slow: 0.0029,
    medium: 0.0117,
    fast: 0.047,
    ultraFast: 0.188 
  }

  const area = computeRectArea(calcData.width, calcData.length)

  const [sprinklers, maxDistance] = (calcData.width && calcData.length) ? computeSprinklersNeeded(area, calcData.width, calcData.length) : [null, null]
  
  // let monteCarloArea = 45
  // let monteCarloWidth = 8
  // let monteCarloLength = monteCarloArea / monteCarloWidth
  // const [sprinklersMonteCarlo] = computeSprinklersNeeded(monteCarloArea, monteCarloWidth, monteCarloLength)
  // console.log(sprinklersMonteCarlo)
  // const randomMonteCarloPoint = findRandomPointInArea(monteCarloWidth, monteCarloLength)
  // const maxDMonteCarlo = computeMaxDistanceFromPoint()
  
  function findRandomPointInArea(width, length) {
    let x = findRandomPointInDimension(width)
    let y = findRandomPointInDimension(-length)
    return [x, y]
  }

  function findRandomPointInDimension(distance, digits=2) {
    return (Math.random()*distance).toFixed(digits)
  }

  function computeMaxDistanceFromPoint(width, length, sprinklerLocationArray, point) {
    let maxDistanceToPoint = null
    let [pointX, pointY] = point 
    // loop through sprinkler locations
    for (let i=0; i<sprinklerLocationArray.length; i++) {
      // find radial distance from current sprinkler to point
      let [currentSprinklerX, currentSprinklerY] = sprinklerLocationArray[i];
      // point: (x, y)
      let diffX = Math.abs(currentSprinklerX-pointX)
      let diffY = Math.abs(currentSprinklerY-pointY)
      // difference
      let distance = computeHypotunous(diffX, diffY)

      if (maxDistanceToPoint == null || maxDistanceToPoint > distance) {
        maxDistanceToPoint = distance
      }
    }
    return maxDistanceToPoint
  }

  function computeSprinklersNeeded(area, width, length) {
    if (area <= 25 && Math.max(length, width) <= 5.5) {
      console.log(calcData)
      return [[[width/2, -length/2]], computeHypotunous(length/2, width/2)]
    } else {
      return computeSprinklerPositions(area, width, length)
    }

  }

  function computeSprinklerPositions(area, width, length) {
    let sprinklerPositionArray = [];
    let sprinklerSpacingArray = [];
    let maxDistanceArray = [];
    let [
      horizontalSprinklers, 
      verticalSprinklers, 
      verticalSpacing, 
      horizontalSpacing
    ] = computeMaxSprinklerSpacingAndGridInRect(width, length)

    let totalSprinklers = horizontalSprinklers * verticalSprinklers
    console.log("horizontalSprinklers: ", horizontalSprinklers, "verticalSprinklers: ", verticalSprinklers)
    console.log("width, height", width, length)

    let internalSprinklers = totalSprinklers;
    let internalWidth = width;
    let internalLength = length;
    let internalHorizontalSpacing = horizontalSpacing 
    let internalVerticalSpacing = verticalSpacing
    let reductionInDimension = 0.1;
    let maxAreaPerSprinkler = 25;

    while (
      internalSprinklers < (
        (internalWidth * internalLength)/maxAreaPerSprinkler)
        ) 
    {

      if (internalHorizontalSpacing > internalVerticalSpacing) {
        internalWidth = reduceDistance(internalWidth, reductionInDimension)
        internalHorizontalSpacing = computeSpacing(internalWidth, horizontalSprinklers)
      } else {
        internalLength = reduceDistance(internalLength, reductionInDimension)
        internalVerticalSpacing = computeSpacing(internalLength, verticalSprinklers)
      }

    }

    // add internal grid and sprinklers to array
    let innerGridPoints = spreadPointsEvenly(horizontalSprinklers, verticalSprinklers, internalWidth, internalLength)
    appendArray2ElementsIntoArray1(sprinklerPositionArray,innerGridPoints)
    // sprinklerPositionArray.push(innerGridPoints)
    maxDistanceArray.push( computeHypotunous(internalVerticalSpacing, internalHorizontalSpacing) )
    // only proceede if perimeter exists
    let perimeterWidth = width - internalWidth;
    let perimeterLength = length - internalLength;

    if (perimeterWidth || perimeterLength > 0) {
      // find sprinklers to serve perimeter area
      // Area 1: perimeterLength * externalWidth
      if (perimeterLength > 0) {
        let [
          area1HorizontalSprinklers, area1VerticalSprinklers, 
          area1VerticalSpacing, area1HorizontalSpacing
        ] = computeMaxSprinklerSpacingAndGridInRect(width, perimeterLength)

        let area1Points = spreadPointsEvenly(
          area1HorizontalSprinklers, 
          area1VerticalSprinklers,
          width, 
          perimeterLength,
          // offsetX = 0
          0,
          // offsetY= internalLength
          internalLength
          )
          // TODO: check if sprinkler locations >= 1.4m away from central grid sprinkler locations
          // if not move sprinkler closer to wall, but must be >=100mm away from wall
          appendArray2ElementsIntoArray1(sprinklerPositionArray,area1Points)
          maxDistanceArray.push( computeHypotunous(area1VerticalSpacing, area1HorizontalSpacing) )
      }
      // Area 2: perimeterWidth * internalGridLength
      if (perimeterWidth > 0) {
        let [
          area2HorizontalSprinklers, area2VerticalSprinklers, 
          area2VerticalSpacing, area2HorizontalSpacing
        ] = computeMaxSprinklerSpacingAndGridInRect(perimeterWidth, internalLength)

        let area2Points = spreadPointsEvenly(
          area2HorizontalSprinklers, 
          area2VerticalSprinklers,
          perimeterWidth, 
          internalLength,
          // offsetX = internalWidth
          internalWidth,
          // offsetY= 0
          0
          )
          // TODO: check if sprinkler locations >= 1.4m away from central grid sprinkler locations
          // if not move sprinkler closer to wall, but must be >=100mm away from wall
          appendArray2ElementsIntoArray1(sprinklerPositionArray, area2Points)
          maxDistanceArray.push( computeHypotunous(area2VerticalSpacing, area2HorizontalSpacing) )
    } 

    }
    return [
      sprinklerPositionArray, 
      Math.max(
        ...maxDistanceArray
        )
    ]
  }

  function appendArray2ElementsIntoArray1(array1, array2) {
    if (Array.isArray(array2[0])) {
      Array.prototype.push.apply(array1,array2)
    } else array1.push(array2)
  }


  function computeMaxSprinklersInRect(width, length, radius=5.5) {
    let horizontalSprinklers = Math.ceil(width / radius)
    let verticalSprinklers = Math.ceil(length / radius)
    return [horizontalSprinklers, verticalSprinklers]
  }

  function computeMaxSprinklerSpacingAndGridInRect(width, length) {
    let [horizontalSprinklers, verticalSprinklers] = computeMaxSprinklersInRect(width, length)
    let verticalSpacing = computeSpacing(length, verticalSprinklers) // computeSpacing(length, verticalSprinklers) call function
    let horizontalSpacing = computeSpacing(width, horizontalSprinklers)
    return [horizontalSprinklers, verticalSprinklers, verticalSpacing, horizontalSpacing]
  }
  


  function reduceDistance(startingDistance, decreaseInDistance) {
    return startingDistance - decreaseInDistance;
  } 

  function computeSpacing(distance, points) {
    return distance / (2 * points)
  }

  function spreadPointsEvenly(pointsAcross, pointsUp, width, length, offsetX=0, offsetY=0) {
    // TODO: if spread between 2.75 and 2.4 - spread evenly
    let verticalSpacing = length/(2*pointsUp);
    let horizontalSpacing = width/(2*pointsAcross);
    console.log("spacing: ", verticalSpacing, horizontalSpacing)

    let points = [];
    for (let i = 0; i < pointsAcross; i++) {
      for (let j = 0; j < pointsUp; j++) {
        // not sure if y is correct??
        let current = [
          horizontalSpacing*(i*2+1)+offsetX, 
          -verticalSpacing*(j*2+1)-offsetY // later convert
        ]
        points.push(current)
      }
    }
    console.log(points)
    return points
  }
  
  function computeArea() {
// TODO: include calc of area within polylines etc
  }

  function computeRectArea(width, length) {
    return width * length
  }

  function computeHypotunous(side1, side2) {
    return ((side1**2) + (side2**2))**(0.5)
  }
  
  function handleInput(event) {
    setCalcData(prev => ({
      ...prev,
      [event.target.name] : event.target.value
    })
      )

  }

  const growthRateDropDownContent = Object.entries(growthRateObject).map(([item, i]) => {
    return <option key={i} value={i}>{item} {i}</option>
  })

  return (
    <>
      <div className="App">
        <canvas
          id="canvas"
          // width={window.innerWidth}
          // height={window.innerHeight}
          // onMouseDown={handleMouseDown}
          // onMouseMove={handleMouseMove}
          // onMouseUp={handleMouseUp}
        >
          Canvas
        </canvas>
        <form>
          <label>{`Width: `}
            <input
              type="text" 
              name='width'
              value={calcData.width || ""}
              onChange={handleInput}
            />
            {`m`}
          </label>
          <br/>
          <label>{`Length: `}
            <input
              type="text" 
              name='length'
              value={calcData.length || ""}
              onChange={handleInput}
            />
            {`m`}
          </label>
          <br/>
          <label>{`Height: `}
            <input
              type="text" 
              name='height'
              value={calcData.height || ""}
              onChange={handleInput}
            />
            {`m`}
          </label>
          <br/>
          <label>{`Fire Growth Rate: `}
            <select
            onChange={handleInput}
            name='growthRate'
            value={calcData.growthRate}
            >
              { growthRateDropDownContent }
            </select>
            {`kW/s2`}
          </label>
          <br/>
          <br/>
          <label>{`Sprinkler RTI: `}
            <input
              type="text" 
              name='rTI'
              value={calcData.rTI}
              onChange={handleInput}
            />
          </label>
          <br/>
          <label>{`Activation Temp: `}
            <input
              type="text" 
              name='tActive'
              value={calcData.tActive}
              onChange={handleInput}
            />
            {`°C`}
          </label>
        </ form>
        <br/>
        { sprinklers && `${sprinklers.length} sprinklers needed`}
        <br/>
        { sprinklers && sprinklers.map((sprinkler) => `[${parseFloat(sprinkler[0]).toFixed(2)}, ${parseFloat(-sprinkler[1]).toFixed(2)}]`)}
        <br/>
        { maxDistance ? `max distance from fire to sprinkler: ${maxDistance.toFixed(2)}m` : null}
        {/* {u && ` ${u} % of the wall can be unprotected`} */}
        <br />
       { (area && calcData.height) ? 
       <ResponseTime 
        maxDistance={maxDistance} 
        roomArea={area}
        roomHeight={calcData.height}
        growthRate={calcData.growthRate}
        rTI={calcData.rTI}
        tActive={calcData.tActive}
         /> 
         : null
         }

      </div>
    </>

  );
}

export default App;
