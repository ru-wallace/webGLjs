import * as geom from "./geometryFunctions.js";
import * as convert from "./conversions.js";

class ATCMap {
  minLat = 0;
  maxLat = 0;
  minLon = 0;
  maxLon = 0;

  widthPx = 0;
  heightPx = 0;

  constructor(lat, lon, radiusNM, scale, widthPx, heightPx) {

    console.log("ATCMap constructor");
    console.log("lat: " + lat);
    console.log("lon: " + lon);
    console.log("radiusNM: " + radiusNM);
    console.log("scale: " + scale);
    console.log("widthPx: " + widthPx);
    console.log("heightPx: " + heightPx);

    this.widthPx = widthPx;
    this.heightPx = heightPx;

    const bounds = geom.calculateMapBounds(widthPx, heightPx, lat, lon, radiusNM, scale);

    this.minLat = bounds.latMin;
    this.maxLat = bounds.latMax;
    this.minLon = bounds.lonMin;
    this.maxLon = bounds.lonMax;
    console.log("Bounds: " + this.minLat + " " + this.maxLat + " " + this.minLon + " " + this.maxLon);
    this.lat = lat;
    this.lon = lon;
    this.radarRadiusNM = radiusNM;
    this.scale = scale;

  }

  updateBounds() {
 
    const bounds = geom.calculateMapBounds(this.widthPx, this.heightPx, this.lat, this.lon, this.radarRadiusNM, this.scale);
    this.setBounds(bounds.latMin, bounds.lonMin, bounds.latMax, bounds.lonMax);
    console.log("Updated Bounds: " + this.minLat + " " + this.maxLat + " " + this.minLon + " " + this.maxLon);

  }

  setCentre(lat, lon) {
    this.lat = lat;
    this.lon = lon;
    console.log("Set centre: " + lat + " " + lon);
    this.updateBounds();
  }

  setRadius(radiusNM) {
    this.radarRadiusNM = radiusNM;
    console.log("Set radius: " + radiusNM);
    this.updateBounds();
  }

  setScale(scale) {
    this.scale = scale;
    console.log("Set scale: " + scale);
    this.updateBounds();
  }

  setDimensions(widthPx, heightPx) {
    this.widthPx = widthPx;
    this.heightPx = heightPx;
    console.log("Set dimensions: " + widthPx + " " + heightPx);
    this.updateBounds();
  }
  setWidth(widthPx) {
    this.widthPx = widthPx;
    console.log("Set width: " + widthPx);
    this.updateBounds();
  }
  setHeight(heightPx) {
    this.heightPx = heightPx;
    console.log("Set height: " + heightPx);
    this.updateBounds();
  }
  setBounds(minLat, minLon, maxLat, maxLon) {
    this.minLat = minLat;
    this.minLon = minLon;
    this.maxLat = maxLat;
    this.maxLon = maxLon;
    console.log("Set bounds: (" + minLat + " " + maxLon + ") (" + maxLat + " " + maxLon + ")");
  }

  distanceNMToPixels(distanceNM) {
    console.log("convert nm to pixels: " + distanceNM);

    const latRange = this.maxLat - this.minLat;
    console.log("latRange: " + latRange);

    const lonRange = this.maxLon - this.minLon;
    const latDistancePx = (distanceNM / 60) * (this.heightPx / latRange);
    return latDistancePx;
  }



  distancePxToNM(distancePx) {
    const latRange = this.maxLat - this.minLat;
    const lonRange = this.maxLon - this.minLon;
    const latDistanceNM = (distancePx / (this.heightPx / latRange)) * 60;
    return latDistanceNM;
  }

  distanceMetresToPixels(distanceMetres) {

    const distanceNM = convert.metresToNauticalMiles(distanceMetres);
    return this.distanceNMToPixels(distanceNM);
  }
  distancePixelsToMetres(distancePx) {
    const distanceNM = this.distancePxToNM(distancePx);
    return convert.nauticalMilesToMetres(distanceNM);
  }

  latLonToXY(lat, lon) {

    const x = ((lon - this.minLon) / (this.maxLon - this.minLon)) * this.widthPx;
    const y = this.heightPx - (((lat - this.minLat) / (this.maxLat - this.minLat)) * this.heightPx);
    // console.log("Result: x: ", x, " y: ", y);
    return { x, y };
  }

  xyToLatLon(x, y) {
    const lon = ((x / this.widthPx) * (this.maxLon - this.minLon)) + this.minLon;
    const lat = ((this.heightPx - y) / this.heightPx) * (this.maxLat - this.minLat) + this.minLat;
    return { lat, lon };
  }

  generateCirclePointsOld(radiusPx, rotation, numPoints, lineThicknessPx, scaleX=1, scaleY=1) {
    if (radiusPx <= 0) {
      throw new Error("radiusPx must be greater than 0");
    }
    if (numPoints < 3) {
      throw new Error("numPoints must be at least 3");
    }
    //console.log("Generating circle. radiusPX:" + radiusPx + " nPoints: " + numPoints + " lineWidth: " + lineThicknessPx);
    const centre = { x: this.widthPx / 2, y: this.heightPx / 2 };
    const points = [];

    const innerRadiusPx = radiusPx - lineThicknessPx / 2;
    const outerRadiusPx = radiusPx + lineThicknessPx / 2;

    //const rotationRad = (rotation * Math.PI) / 180;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;// + rotationRad;

      const outerX = (outerRadiusPx) * Math.cos(angle);
      const outerY = (outerRadiusPx) * Math.sin(angle);

      const innerX = (innerRadiusPx) * Math.cos(angle);
      const innerY = (innerRadiusPx) * Math.sin(angle);
      points.push(outerX, outerY, innerX, innerY);
    }

    // transform the points with glMatrix

    const transformedPoints = geom.transformPointsArray(
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

    return transformedPoints; 
  }

  


  generateCirclePoints(radiusPx, rotation, numPoints, lineThicknessPx, scaleX = 1, scaleY = 1) {
    if (radiusPx <= 0) {
      throw new Error("radiusPx must be greater than 0");
    }
    if (numPoints < 3) {
      throw new Error("numPoints must be at least 3");
    }
    //console.log("Generating circle. radiusPX:" + radiusPx + " nPoints: " + numPoints + " lineWidth: " + lineThicknessPx);
    const centre = { x: this.widthPx / 2, y: this.heightPx / 2 };
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
    const lastX = transformedPoints[transformedPoints.length - 2];
    const lastY = transformedPoints[transformedPoints.length - 1];

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



  generateCircleIndices(circlePoints, startIndex = 0) {
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

  generateCircle(radiusPx, rotation, numPoints, lineThicknessPx, startIndex = 0, scaleX=1, scaleY=1) {
    console.log("Generating circle. radiusPX:" + radiusPx + " nPoints: " + numPoints + " lineWidth: " + lineThicknessPx);
    const circlePoints = this.generateCirclePoints(radiusPx, rotation, numPoints, lineThicknessPx, scaleX, scaleY);
    const circleIndices = this.generateCircleIndices(circlePoints, startIndex);
    console.log("Circle. (" + circlePoints.length + " points, " + circleIndices.length + " indices)");
    //console.log("points: " + circlePoints);
    //console.log("indices: " + circleIndices);
    return { points: circlePoints, indices: circleIndices };
  }

  generateFilledCircle(radiusPx, numPoints, startIndex = 0) {
    if (radiusPx <= 0) {
      throw new Error("radiusPx must be greater than 0");
    }
    if (numPoints < 3) {
      throw new Error("numPoints must be at least 3");
    }

    console.log("Generating filled circle. radiusPX:" + radiusPx + " nPoints: " + numPoints);
    const centre = { x: this.widthPx / 2, y: this.heightPx / 2 };

    const points = [centre.x, centre.y]; // Start with the centre point
    var indices = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;

      const x = centre.x + radiusPx * Math.cos(angle);
      const y = centre.y + radiusPx * Math.sin(angle);

      points.push(x, y); // centre point and outer point

      if (i > 1) {
        indices.push(0, i, i - 1); // 0 2 1, 0 3 2, 0 4 3, etc.
      }


    }

    // Connect the last point to the first point
    indices.push(0, 1, numPoints - 1);

    indices = indices.map(index => index + startIndex); // Adjust indices to start from 0

    console.log("Filled circle. (" + points.length + " points, " + indices.length + " indices)");
    //console.log("points: " + points);
    //console.log("indices: " + indices);
    return { points, indices }; // Adjust indices to start from 0
  }

  generateArrowPoints(width, height) {
    const centre = { x: this.widthPx / 2, y: this.heightPx / 2 };
    const points = [];

    const frontY = centre.y - (height * 0.5);

    const backCentreY = centre.y + (height * 0.3);
    const backPointsY = centre.y + (height * 0.5);

    const leftX = centre.x - (width * 0.5);
    const rightX = centre.x + (width * 0.5);

    points.push(centre.x, backCentreY, centre.x, frontY, leftX, backPointsY, rightX, backPointsY); // 0 1 2 3


    return points;
  }

  generateArrowIndices(startIndex = 0) {
    const indices = [0, 1, 2, 0, 3, 1]; //0,3,1

    return indices.map(index => index + startIndex);
  }

  generateArrow(width, height, startIndex = 0) {
    console.log("Generating arrow. width: " + width + " height: " + height + " startIndex: " + startIndex);
    const arrowPoints = this.generateArrowPoints(width, height);
    const arrowIndices = this.generateArrowIndices(startIndex);
    console.log("Arrow. (" + arrowPoints.length + " points, " + arrowIndices.length + " indices)");
    //console.log("points: " + arrowPoints);
    //console.log("indices: " + arrowIndices);
    return { points: arrowPoints, indices: arrowIndices };
  }



  generateRectangle(width, height, startIndex = 0) {
    console.log("Generating rectangle. width: " + width + " height: " + height + " startIndex: " + startIndex);
    const centre = { x: this.widthPx / 2, y: this.heightPx / 2 };
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




}

export { ATCMap };