import { createMatrix } from "./matrixFunctions.js";

function getStartIndex(points) {
  return points.length / 2;
}

export function generateShapes(map, params) {
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
  const radarCircle = map.generateCircle(
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


  const circle = map.generateCircle(
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

  const arrow = map.generateArrow(
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

  
  const rectangle = map.generateRectangle(
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

  const filledCircleData = map.generateFilledCircle(
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

  const vorHexSymbol = map.generateCircle(
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
  const vorSquareSymbol = map.generateCircle(
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


