export function findRandomPointInArea(width, length) {
    let x = findRandomPointInDimension(width)
    let y = findRandomPointInDimension(-length)
    return [x, y]
  }

export function findRandomPointInDimension(distance, digits=2) {
    return (Math.random()*distance).toFixed(digits)
  }

export function computeMaxDistanceFromPoint(width, length, sprinklerLocationArray, point) {
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

  export function computeHypotunous(side1, side2) {
    return ((side1**2) + (side2**2))**(0.5)
  }

  export function computeSprinklersNeeded(area, width, length) {
    if (area <= 25 && Math.max(length, width) <= 5.5) {
      return [[[width/2, -length/2]], computeHypotunous(length/2, width/2)]
    } else {
      return computeSprinklerPositions(area, width, length)
    }

  }

  export function computeSprinklerPositions(area, width, length) {
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

  export function appendArray2ElementsIntoArray1(array1, array2) {
    if (Array.isArray(array2[0])) {
      Array.prototype.push.apply(array1,array2)
    } else array1.push(array2)
  }


  export function computeMaxSprinklersInRect(width, length, radius=5.5) {
    let horizontalSprinklers = Math.ceil(width / radius)
    let verticalSprinklers = Math.ceil(length / radius)
    return [horizontalSprinklers, verticalSprinklers]
  }

  export function computeMaxSprinklerSpacingAndGridInRect(width, length) {
    let [horizontalSprinklers, verticalSprinklers] = computeMaxSprinklersInRect(width, length)
    let verticalSpacing = computeSpacing(length, verticalSprinklers) // computeSpacing(length, verticalSprinklers) call function
    let horizontalSpacing = computeSpacing(width, horizontalSprinklers)
    return [horizontalSprinklers, verticalSprinklers, verticalSpacing, horizontalSpacing]
  }
  


  export function reduceDistance(startingDistance, decreaseInDistance) {
    return startingDistance - decreaseInDistance;
  } 

  export function computeSpacing(distance, points) {
    return distance / (2 * points)
  }

  export function spreadPointsEvenly(pointsAcross, pointsUp, width, length, offsetX=0, offsetY=0) {
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

  export function computeRectArea(width, length) {
    return width * length
  }

