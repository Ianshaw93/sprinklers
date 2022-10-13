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
  // must be <= 5.5m2 per sprinkler
  // const sprinklers = Math.ceil(Math.max(calcData.width, calcData.length) / 5.5)
  const [sprinklers, maxDistance] = computeSprinklersNeeded(area, calcData.width, calcData.length)
  

  function computeSprinklersNeeded(area, width, length) {
    if (area <= 25 && Math.max(length, width) <= 5.5) {
      // setCalcData({...calcData, sprinklers: [[width/2, -length/2]]})
      console.log(calcData)
      return [[[width/2, -length/2]], computeSpacing(Math.max(length, width), 1)]
    } else {
      // let [positions, maxD] = computeSprinklerPositions(area, width, length)
      // setCalcData({...calcData, sprinklers: positions})
      return computeSprinklerPositions(area, width, length)
    }

  }

  function computeSprinklerPositions(area, width, length) {
    let sprinklerPositionArray = [];
    let sprinklerSpacingArray = [];
    let radiusArray = [];
    let [
      horizontalSprinklers, 
      verticalSprinklers, 
      verticalSpacing, 
      horizontalSpacing
    ] = computeMaxSprinklerSpacingAndGridInRect(width, length)

    let totalSprinklers = horizontalSprinklers * verticalSprinklers
    console.log("horizontalSprinklers: ", horizontalSprinklers, "verticalSprinklers: ", verticalSprinklers)
    console.log("width, height", width, length)
    // check if area/25 > total sprinklers from above
    // should be iterative?
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
    Array.prototype.push.apply(sprinklerPositionArray,innerGridPoints)

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
          perimeterLength
          // likely needs offset
          )
        // Area 1 needs internal length to be added to all points (using js y positive downwards) 
      }
      // Area 2: perimeterWidth * internalGridLength
      // Area 2 needs internal width to be added to all points (using js x positive to right) 

    } // else finish

    let [
      perimeterHorizontalSprinklers, 
      perimeterVerticalSprinklers, 
      perimeterVerticalSpacing, 
      perimeterHorizontalSpacing
    ] = computeMaxSprinklerSpacingAndGridInRect(perimeterWidth, perimeterLength)

    // below can be once broken out of while loop
    if (totalSprinklers >= area/25) {
      // continue
      // locate evenly
      // should add points of grid to sprinkler locations
      // then can be re-used for perimeter logic
      let newPoints = spreadPointsEvenly(
        horizontalSprinklers, 
        verticalSprinklers, 
        width, length
        )

      let newSpacing = [verticalSpacing, horizontalSpacing]  
      appendArray2ElementsIntoArray1(sprinklerPositionArray,newPoints)
      appendArray2ElementsIntoArray1(sprinklerSpacingArray,newSpacing)
      let newRadius = computeHypotunous(verticalSpacing, horizontalSpacing) // append to distance array
      radiusArray.push(newRadius)
      console.log("less than 25sqm per sprinkler")
      return [
        sprinklerPositionArray, 
          // sprinklers all spaced evenly in config
          //  therefore should be max sprinkler spacing
          // if changed to recursion, should be check against max spacing
          // also location of sprinklers with max spacing
        Math.max(
          // verticalSpacing, 
          // horizontalSpacing
          ...radiusArray
          )
      ]
    } else {
      console.log("further sprinklers needed at perimeter")
      // add further sprinkler(s)
      // reduce area until sprinkler >= area /25
      let internalSprinklers = totalSprinklers;
      let internalWidth, internalLength = width, length;
      let reductionInDimension = 0.1
      // let internalArea = area
      while (internalSprinklers < ((internalWidth * internalLength)/25)) {
        
        if (internalWidth > internalLength) {
          internalWidth = reduceDistance(internalWidth, reductionInDimension)
        } else {
          internalLength = reduceDistance(internalLength, reductionInDimension)
        }

      }

      // locate evenly inner grid only
      // use dimensions to get spread even and receive spread; 
      let innerGridPoints = spreadPointsEvenly(horizontalSprinklers, verticalSprinklers, internalWidth, internalLength)
      Array.prototype.push.apply(sprinklerPositionArray,innerGridPoints)

      // let totatSprinklerLocations = innerGridPoints; // add perimeter
      // add sprinklers as needed to perimeter
      // let internalVerticalSpaing = computeSpacing(internalLength, verticalSprinklers)
      // should loop through; in
      let perimeterWidth = width - internalWidth;
      let perimeterLength = length - internalLength;
      // find sprinklers to serve perimeter area
      let [
        perimeterHorizontalSprinklers, 
        perimeterVerticalSprinklers, 
        perimeterVerticalSpacing, 
        perimeterHorizontalSpacing
      ] = computeMaxSprinklerSpacingAndGridInRect(perimeterWidth, perimeterLength)

      // check if <25sqm per sprinkler
      let perimeterArea = perimeterWidth*perimeterLength
      let totalPerimeterSprinklers = perimeterHorizontalSprinklers*perimeterVerticalSprinklers
      if (totalPerimeterSprinklers >= perimeterArea/25) {
        let perimeterSprinklerLocations = spreadPointsEvenly(
          perimeterHorizontalSprinklers, 
          perimeterVerticalSprinklers, 
          perimeterWidth, perimeterLength
          )
          appendArray2ElementsIntoArray1(sprinklerPositionArray,perimeterSprinklerLocations)
      } // else add further points to perimeter
      else { console.log("futher recursive logic needed")}
      return [
        sprinklerPositionArray, 
        // TODO: should check if any perimeter spacing is larger
        // could use spacing array Math.max(...spacingArray)
        computeHypotunous(verticalSpacing, horizontalSpacing)
        // Math.max(verticalSpacing, horizontalSpacing)
      ]
      
    }
  }

  function appendArray2ElementsIntoArray1(array1, array2) {
    Array.prototype.push.apply(array1,array2)
  }

  function checkSprinklerArea() {

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
        let current = [horizontalSpacing*(i*2+1)+offsetX, -verticalSpacing*(j*2+1)+offsetY]
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
        { sprinklers && sprinklers.map((sprinkler) => `[${sprinkler[0]}, ${-sprinkler[1]}]`)}
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
