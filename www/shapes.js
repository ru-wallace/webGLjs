import * as matFuncs from "./matrixFunctions.js";
import * as geom from "./geometryFunctions.js";

function getStartIndex(points) {
  return points.length / 2;
}

export function generateShapes(params) {
  const defaultParams = {
    radarCircle: {

      radius: 10,
      nPoints: 100,
      lineWidth: 0.5,
    },
    circle: {
      radius: 1.5,
      nPoints: 100,
      lineWidth: 0.5
    },
    arrow: {
      width: 2,
      height: 4
    },
    rectangle: {
      width: 1,
      height: 1
    },
    filledCircle: {
      radius: 1,
      nPoints: 20
    },
    vorSymbol: {
      sizePx: 10,
      lineWidth: 2
    }
  };

  const shapesParams = { ...defaultParams, ...params };

  console.log("shapesParams: ", shapesParams);

  const shapes = {
    points: [],
    indices: [],
    radarCircle: {
      zeroIndex: 0,
      elementStartIndex: 0,
      nPoints: 0,
      nIndices: 0,
      indices: [],
    },
    circle: {
      zeroIndex: 0,
      elementStartIndex: 0,
      nPoints: 0,
      nIndices: 0,
      indices: [],
    },
    arrow: {
      zeroIndex: 0,
      elementStartIndex: 0,
      nPoints: 0,
      nIndices: 0,

      indices: [],
    },
    rectangle: {
      zeroIndex: 0,
      elementStartIndex: 0,
      nPoints: 0,
      nIndices: 0,
      indices: [],
    },
    filledCircle: {
      zeroIndex: 0,
      elementStartIndex: 0,
      nPoints: 0,
      nIndices: 0,
      indices: [],
    },
    vorSymbol: {
      zeroIndex: 0,
      elementStartIndex: 0,
      nPoints: 0,
      nIndices: 0,
      indices: [],
    },

  };

  const points = [];
  const indices = [];

  const zeroRotation = 0;

  // Radar Circle

  shapes.radarCircle.zeroIndex = getStartIndex(points);
  const radarCircle = generateCircle(
    shapesParams.radarCircle.radius,
    zeroRotation,
    shapesParams.radarCircle.nPoints,
    shapesParams.radarCircle.lineWidth,
    shapes.radarCircle.zeroIndex
  );

  points.push(...radarCircle.points);
  indices.push(...radarCircle.indices);

  shapes.radarCircle.nIndices = radarCircle.indices.length;
  shapes.radarCircle.nPoints = radarCircle.points.length;
  shapes.radarCircle.indices = radarCircle.indices;
  shapes.circle.zeroIndex = 0;
  shapes.circle.elementStartIndex = 0;

  // Plane Circle


  const circle = generateCircle(
    shapesParams.circle.radius,
    zeroRotation,
    shapesParams.circle.nPoints,
    shapesParams.circle.lineWidth,
    shapes.circle.zeroIndex
  );
  
  points.push(...circle.points);
  indices.push(...circle.indices);
  shapes.circle.nIndices = circle.indices.length;
  shapes.circle.indices = circle.indices;
  shapes.circle.nPoints = circle.points.length;
  // Plane Pointer arrow

  shapes.arrow.zeroIndex = 0;
  shapes.arrow.elementStartIndex = 0;

  const arrow = generateArrow(
    shapesParams.arrow.width,
    shapesParams.arrow.height,
    shapes.arrow.zeroIndex
  );
  points.push(...arrow.points);
  indices.push(...arrow.indices);
  shapes.arrow.nIndices = arrow.indices.length;
  shapes.arrow.indices = arrow.indices;
  shapes.arrow.nPoints = arrow.points.length;
  // Rectangle for speed indicator
  shapes.rectangle.zeroIndex = 0;
  shapes.rectangle.elementStartIndex = 0;

  
  const rectangle = generateRectangle(
    shapesParams.rectangle.width,
    shapesParams.rectangle.height,
    shapes.rectangle.zeroIndex
  );
  points.push(...rectangle.points);
  indices.push(...rectangle.indices);
  shapes.rectangle.nIndices = rectangle.indices.length;
  shapes.rectangle.nPoints = rectangle.points.length;
  shapes.rectangle.indices = rectangle.indices;

  shapes.filledCircle.zeroIndex = 0;
  shapes.filledCircle.elementStartIndex = 0;

  const filledCircleData = generateFilledCircle(
    shapesParams.filledCircle.radius,
    shapesParams.filledCircle.nPoints,
    shapes.filledCircle.zeroIndex
  );
  points.push(...filledCircleData.points);
  indices.push(...filledCircleData.indices);

  shapes.filledCircle.nIndices = filledCircleData.indices.length;
  shapes.filledCircle.indices = filledCircleData.indices;
  shapes.filledCircle.nPoints = filledCircleData.points.length;
  // VOR Symbol uses filledCircle points and indices, adds hexagon and square

  shapes.vorSymbol.zeroIndex = -filledCircleData.points.length;

  shapes.vorSymbol.elementStartIndex = shapes.filledCircle.elementStartIndex;

  const vorHexSymbolNPoints = 6;
  const vorHexSymbolLineWidth = shapesParams.vorSymbol.lineWidth;
  const vorHexSymbolZeroIndex = filledCircleData.points.length/2;

  const vorHexSymbol = generateCircle(
    shapesParams.vorSymbol.sizePx,
    zeroRotation,
    vorHexSymbolNPoints,
    vorHexSymbolLineWidth,
    vorHexSymbolZeroIndex
  );


  points.push(...vorHexSymbol.points);
  indices.push(...vorHexSymbol.indices);

  const vorSquareSymbolNPoints = 4;
  const vorSquareSymbolRadius = shapesParams.vorSymbol.sizePx * Math.sqrt(2); //square needs larger radius to fit hexagon
  const vorSquareSymbolScaleX = 1;
  const vorSquareSymbolScaleY =  (Math.cos(Math.PI / 6));
  const vorSquareSymbolLineWidth = shapesParams.vorSymbol.lineWidth;
  const vorSquareSymbolZeroIndex = vorHexSymbolZeroIndex + vorHexSymbol.points.length/2; // start after hexagon points
  const vorSquareRotation = 45; // 45 degrees to rotate the square to match the hexagon
  const vorSquareSymbol = generateCircle(
    vorSquareSymbolRadius,
    vorSquareRotation,
    vorSquareSymbolNPoints,
    vorSquareSymbolLineWidth,
    vorSquareSymbolZeroIndex,
    vorSquareSymbolScaleX,
    vorSquareSymbolScaleY
  );

  shapes.vorSymbol.indices.push(...filledCircleData.indices);
  shapes.vorSymbol.indices.push(...vorHexSymbol.indices);
  shapes.vorSymbol.indices.push(...vorSquareSymbol.indices);

  points.push(...vorSquareSymbol.points);
  indices.push(...vorSquareSymbol.indices);
  shapes.vorSymbol.nIndices = shapes.filledCircle.nIndices + vorHexSymbol.indices.length + vorSquareSymbol.indices.length;
  shapes.vorSymbol.nPoints = filledCircleData.points.length + vorHexSymbol.points.length + vorSquareSymbol.points.length;
  shapes.points = points;
  shapes.indices = indices;

  console.log("shapes: ", shapes);
  return shapes;


}



/* Functions to generate the shapes. */

function generateCirclePoints(radiusPx, rotation, numPoints, lineThicknessPx, scaleX = 1, scaleY = 1) {
    if (radiusPx <= 0) {
      throw new Error("radiusPx must be greater than 0");
    }
    if (numPoints < 3) {
      throw new Error("numPoints must be at least 3");
    }
    //console.log("Generating circle. radiusPX:" + radiusPx + " nPoints: " + numPoints + " lineWidth: " + lineThicknessPx);
    const centre = { x:0, y: 0 };
    const points = [];


    //const rotationRad = (rotation * Math.PI) / 180;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;// + rotationRad;

      const x = (radiusPx) * Math.cos(angle);
      const y = (radiusPx) * Math.sin(angle);
      points.push(x, y);
    }

    // transform the points with glMatrix

    const transformedPoints= geom.transformPointsArray(
      points,
      {
        translateX: centre.x,
        translateY: centre.y,
        scaleX: scaleX,
        scaleY: scaleY,
        rotateDeg: rotation,
        centerX: radiusPx,
        centerY: radiusPx,
      }
    );

    const pointsWithLineWidth = [];


    //pointsWithLineWidth.push(...geom.calculateCornerPoints(lastX, lastY, transformedPoints[0], transformedPoints[1], transformedPoints[2], transformedPoints[3], lineThicknessPx));

    for (let i = 0; i < transformedPoints.length; i += 2) {
      
      const index1 = i;
      const index2 = i + 2 >= transformedPoints.length ? i + 2 - transformedPoints.length : i + 2;
      const index3 = i + 4 >= transformedPoints.length ? i + 4 - transformedPoints.length : i + 4;

      const x1 = transformedPoints[index1];
      const y1 = transformedPoints[index1 + 1];
      const x2 = transformedPoints[index2];
      const y2 = transformedPoints[index2 + 1];
      const x3 = transformedPoints[index3];
      const y3 = transformedPoints[index3 + 1];



      pointsWithLineWidth.push(...geom.calculateCornerPoints(x1, y1, x2, y2, x3, y3, lineThicknessPx));
    }


    return pointsWithLineWidth; // Adjusted points with line width

  }



function generateCircleIndices(circlePoints, startIndex = 0) {
    var indices = [];
    const numPoints = ((circlePoints.length) / 4); // Each point has x and y coordinates

    for (let i = 0; i < numPoints - 1; i++) {
      indices.push(i * 2, i * 2 + 1, (i + 1) * 2); // 0 1 2
      indices.push(i * 2 + 1, (i + 1) * 2 + 1, (i + 1) * 2); // 1 3 2
    }

    // Connect the last point to the first point
    indices.push((numPoints - 1) * 2, (numPoints - 1) * 2 + 1, 0);
    indices.push((numPoints - 1) * 2 + 1, 1, 0);
    indices = indices.map(index => index + startIndex); // Adjust indices to start from startIndex


    return indices;
  }

function generateCircle(radiusPx, rotation, numPoints, lineThicknessPx, startIndex = 0, scaleX=1, scaleY=1) {
    console.log("Generating circle. radiusPX:" + radiusPx + " nPoints: " + numPoints + " lineWidth: " + lineThicknessPx);
    console.log("scaleX: " + scaleX + " scaleY: " + scaleY);
    console.log("startIndex: " + startIndex);
    const circlePoints = generateCirclePoints(radiusPx, rotation, numPoints, lineThicknessPx, scaleX, scaleY);
    const circleIndices = generateCircleIndices(circlePoints, startIndex);
    console.log("Circle. (" + circlePoints.length + " points, " + circleIndices.length + " indices)");
    //console.log("points: " + circlePoints);
    //console.log("indices: " + circleIndices);
    return { points: circlePoints, indices: circleIndices };
  }

function generateFilledCircle(radiusPx, numPoints, startIndex = 0) {
    if (radiusPx <= 0) {
      throw new Error("radiusPx must be greater than 0");
    }
    if (numPoints < 3) {
      throw new Error("numPoints must be at least 3");
    }

    console.log("Generating filled circle. radiusPX:" + radiusPx + " nPoints: " + numPoints);
    const centre = { x:0, y: 0 };

    const points = [centre.x, centre.y]; // Start with the centre point
    var indices = [];
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;

      const x = centre.x + radiusPx * Math.cos(angle);
      const y = centre.y + radiusPx * Math.sin(angle);

      points.push(x, y); // centre point and outer point

      if (i > 1) {
        indices.push(0, i, i - 1); // 0 2 1, 0 3 2, 0 4 3, etc.
      }


    }

    // Connect the last point to the first point
    indices.push(0, 1, numPoints);

    indices = indices.map(index => index + startIndex); // Adjust indices to start from 0

    console.log("Filled circle. (" + points.length + " points, " + indices.length + " indices)");
    console.log("points: " + points);
    console.log("indices: " + indices);
    for (let i=0; i<indices.length; i++){
      console.log("" + i + ": index: " + indices[i], " point: " + points[indices[i]*2] + " " + points[indices[i]*2+1]);
    }
    return { points, indices }; // Adjust indices to start from 0
  }

function generateArrowPoints(width, height) {
        const centre = { x:0, y: 0 };
    const points = [];

    const frontY = centre.y - (height * 0.5);

    const backCentreY = centre.y + (height * 0.3);
    const backPointsY = centre.y + (height * 0.5);

    const leftX = centre.x - (width * 0.5);
    const rightX = centre.x + (width * 0.5);

    points.push(centre.x, backCentreY, centre.x, frontY, leftX, backPointsY, rightX, backPointsY); // 0 1 2 3


    return points;
  }

function generateArrowIndices(startIndex = 0) {
    const indices = [0, 1, 2, 0, 3, 1]; //0,3,1

    return indices.map(index => index + startIndex);
  }

function generateArrow(width, height, startIndex = 0) {
    console.log("Generating arrow. width: " + width + " height: " + height + " startIndex: " + startIndex);
    const arrowPoints = generateArrowPoints(width, height);
    const arrowIndices = generateArrowIndices(startIndex);
    console.log("Arrow. (" + arrowPoints.length + " points, " + arrowIndices.length + " indices)");
    //console.log("points: " + arrowPoints);
    //console.log("indices: " + arrowIndices);
    return { points: arrowPoints, indices: arrowIndices };
  }



function  generateRectangle(width, height, startIndex = 0) {
    console.log("Generating rectangle. width: " + width + " height: " + height + " startIndex: " + startIndex);
    const centre = { x:0, y: 0 };
    const points = [];
    //make pointer points

    const pointerx1 = centre.x - (0.5 * width);
    const pointerx2 = centre.x + (0.5 * width);

    const pointery1 = centre.y + height;
    const pointery2 = centre.y - height;
    points.push(pointerx1, pointery1, pointerx2, pointery1, pointerx2, pointery2, pointerx1, pointery2); // 0 1 2 3

    const initialIndices = [0, 3, 1, 1, 3, 2]; //0,3,1
    const indices = initialIndices.map(index => index + startIndex); // Adjust indices to start from 0
    console.log("Rectangle. (" + points.length + " points, " + indices.length + " indices)");
    console.log("points: " + points);
    console.log("indices: " + indices);
    return { points, indices }; // Adjust indices to start from 0

  }

