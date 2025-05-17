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
    console.log("Set bounds: (" + minLat + " " + maxLon + ") (" + maxLat + " " + minLon + ")");
  }

  distanceNMToPixels(distanceNM) {
    // console.log("convert nm to pixels: " + distanceNM);

    const latRange = this.maxLat - this.minLat;
    // console.log("latRange: " + latRange);

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


}

export { ATCMap };