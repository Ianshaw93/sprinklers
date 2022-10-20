import { useEffect, useRef, useState } from 'react';
import './App.css';
import ResponseTime from './components/ResponseTime';
import {computeSprinklersNeeded, computeRectArea} from './helpers/sprinklerLayoutUtils'
import MonteCarloSim from './components/MonteCarloSim';

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
  // TODO: action MC sim on button press only

  const canvasRef = useRef(null); // allows props to component

  useEffect(() => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    // context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle=('blue');
    context.rect(0, 0, calcData.width, calcData.height);
    context.fill();
  
  }, [calcData])

  const growthRateObject = {
    slow: 0.0029,
    medium: 0.0117,
    fast: 0.047,
    ultraFast: 0.188 
  }

  const area = computeRectArea(calcData.width, calcData.length)

  const [sprinklers, maxDistance] = (calcData.width && calcData.length) ? computeSprinklersNeeded(area, calcData.width, calcData.length) : [null, null]
  
  
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
          {/* <br/>
          <label>{`Custom Fire Growth Rate: `}
            <input
              type="text" 
              name='growthRate'
              value={calcData.growthRate || ""}
              onChange={handleInput}
            />
            {`kW/s2`}
          </label> */}
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
         <MonteCarloSim />
      {/* {(csvData) ? <CSVLink data={csvData} filename={"mcSimReport"} target={"_blank"} >Export MonteCarlo Sim to Csv</CSVLink>  : null} */}
      </div>
    </>

  );
}

export default App;
