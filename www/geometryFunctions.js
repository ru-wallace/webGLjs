import * as convert from "./conversions.js";

const EARTH_RADIUS_METRES = 6371000; // radius of the Earth in metres

export function calculateDistance(lat1, lon1, lat2, lon2, altitude = 0) {
  // Haversine formula to calculate distance between two points on the Earth
  const dLat = convert.degreesToRadians(lat2 - lat1);
  const dLon = convert.degreesToRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(convert.degreesToRadians(lat1)) *
      Math.cos(convert.degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (EARTH_RADIUS_METRES+altitude) * c; // distance in metres
}

export function calculateBearing(lat1, lon1, lat2, lon2) {
  // Calculate the bearing between two points on the Earth
  const dLon = convert.degreesToRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(convert.degreesToRadians(lat2));
  const x =
    Math.cos(convert.degreesToRadians(lat1)) * Math.sin(convert.degreesToRadians(lat2)) -
    Math.sin(convert.degreesToRadians(lat1)) *
      Math.cos(convert.degreesToRadians(lat2)) *
      Math.cos(dLon);
  return (convert.radiansToDegrees(Math.atan2(y, x)) + 360) % 360; // bearing in degrees
}
export function calculateDestination(lat, lon, distanceMetres, bearing, altitudeM = 0) {
  // Calculate the destination point given a starting point, distance, and bearing
  // console.log("Calculate destination: lat: " + lat + " lon: " + lon + " distance: " + distanceMetres + " bearing: " + bearing);
  const lat1 = convert.degreesToRadians(lat);
  const lon1 = convert.degreesToRadians(lon);
  const angularDistance = distanceMetres / (EARTH_RADIUS_METRES + altitudeM); // angular distance in radians
  const trueCourse = convert.degreesToRadians(bearing);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(trueCourse)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(trueCourse) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );
  
  // console.log("Result: lat2: " + convert.radiansToDegrees(lat2) + " lon2: " + convert.radiansToDegrees(lon2));
  return {
    lat: convert.radiansToDegrees(lat2),
    lon: convert.radiansToDegrees(lon2),
  };
}


export function calculateMapBounds(widthPx, heightPx, lat, lon, radarRadiusNM, scale = 1.1) {

  console.log("calculateMapBounds: widthPx: " + widthPx + " heightPx: " + heightPx + " lat: " + lat + " lon: " + lon + " radarRadiusNM: " + radarRadiusNM);
  radarRadiusNM = radarRadiusNM * scale;
  var aspectRatio = widthPx / heightPx;
  console.log("aspectRatio: " + aspectRatio);

  var halfLatDistance = radarRadiusNM;
  console.log("halfLatDistance: " + halfLatDistance);
  if (heightPx > widthPx) {
    halfLatDistance *= aspectRatio;
    console.log("tall map: halfLatDistance: " + halfLatDistance);
  }



  var halfLonDistance = halfLatDistance * aspectRatio;

  console.log("halfLonDistance: " + halfLonDistance);

  // console.log("halfLatDistance: " + halfLatDistance);
  // console.log("halfLonDistance: " + halfLonDistance);

  var latMax = lat + (halfLatDistance / 60); // Convert nautical miles to degrees
  var latMin = lat - (halfLatDistance / 60); // Convert nautical miles to degrees

  console.log("latMin: " + latMin);
  console.log("latMax: " + latMax);

  var leftCentreCoordinate = calculateDestination(lat, lon, convert.nauticalMilesToMetres(halfLonDistance), 270);

  console.log("leftCentreCoordinate: " + leftCentreCoordinate.lat + " " + leftCentreCoordinate.lon);
  const lonMin = leftCentreCoordinate.lon;
  const lonMax = lon + (lon - lonMin); 

  console.log("lonMin: " + lonMin);
  console.log("lonMax: " + lonMax);

  console.log("map width: " + 2*halfLonDistance + "NM, map height: " + 2*halfLatDistance + "NM");
  console.log("geographic aspect ratio: " + (2 * halfLonDistance) / (2 * halfLatDistance));
  console.log("pixel aspect ratio: " + aspectRatio);
  return {
    latMin,
    latMax,
    lonMin,
    lonMax,
  };
  

}

const defaultTransformParams = {
  translateX: 0,
  translateY: 0,
  scale:1,
  scaleX: 1,
  scaleY: 1,
  rotateRad: 0,
  rotateDeg: 0,
  centerX: 0,
  centerY: 0,
};

export function transformPointsArray(points, params) {

  if (!Array.isArray(points) || points.length % 2 !== 0) {
    throw new Error("Invalid points array. Must be an array of x, y pairs.");
  }
  const transformParams = { ...defaultTransformParams, ...params };

  if (transformParams.rotateDeg !== 0) {
    if (transformParams.rotateRad !== 0) {
      console.warn("Both rotateDeg and rotateRad are set. Using rotateRad.");
    } else {
      transformParams.rotateRad = convert.degreesToRadians(transformParams.rotateDeg);
    }
  }
  if (transformParams.scale !== 1) {
    if (transformParams.scaleX !== 1 || transformParams.scaleY !== 1) {
      console.warn("Both scale and scaleX/scaleY are set. Using scaleX and scaleY.");
    } else {
      transformParams.scaleX = transformParams.scale;
      transformParams.scaleY = transformParams.scale;
    }
  }

 
  const transformMatrix = glMatrix.mat2d.create();
  glMatrix.mat2d.identity(transformMatrix);
  glMatrix.mat2d.translate(transformMatrix, transformMatrix, [transformParams.translateX, transformParams.translateY]);
 
  glMatrix.mat2d.scale(transformMatrix, transformMatrix, [transformParams.scaleX, transformParams.scaleY]);

  glMatrix.mat2d.rotate(transformMatrix, transformMatrix, transformParams.rotateRad);

  //glMatrix.mat2d.translate(transformMatrix, transformMatrix, [-transformParams.centerX, -transformParams.centerY]);


  const vec2Array = [];


  for (let i = 0; i < points.length; i += 2) {


    const vec2 = glMatrix.vec2.fromValues(points[i], points[i + 1])
    glMatrix.vec2.transformMat2d(vec2, vec2, transformMatrix);
    vec2Array.push(vec2[0], vec2[1]);


  }



  return vec2Array;
}

// calculate inner and outer points of the intersection of two lines of a given width
// point 2 is the center point
export function calculateCornerPoints(x1, y1, x2, y2, x3, y3, lineWidth) {
  
  const theta1 = Math.atan2(y2 - y1, x2 - x1);
  const theta2 = Math.atan2(y3 - y2, x3 - x2);

  const theta2_90 = theta2 + Math.PI / 2;

  const theta3 = (theta1 + theta2) / 2;

  const phi = theta3 - theta2_90;

  const r = Math.cos(phi) * lineWidth / 2;
  const dx = Math.sin(theta3) * r;
  const dy = Math.cos(theta3) * r;

  //left and right if looking from point 1 to point 2
  // if building a polygon clockwise, left is outer point and right is inner
  const rightX = x2 - dx;
  const rightY = y2 + dy;



  const leftX = x2 + dx;
  const leftY = y2 - dy;
  


  return [leftX, leftY, rightX, rightY]; // just the order used for the polygon coordinates
   



}

