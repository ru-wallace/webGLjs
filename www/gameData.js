import { PlaneList } from "./planes.js";
import { ATCMap } from "./map.js";
import * as utils from "./utils.js"


export const historySeparationMethod = Object.freeze({

  /**@type {number} */
  TIME: 0, // NOT IMPLEMENTED
  /**@type {number} */
  DISTANCE: 1,

});

const defaultParams = {

  // Main game parameters
  
  centre: {
    /**@type {number} */
    lat: 55.87348,
    /**@type {number} */
    lon: -4.43058,
  },
  /**@type {number} */
  radius: 24.41, //radar radius in nautical miles
  /**@type {number} */
  scale: 1.1, //scale (1.1 = 10% more than radar radius)

  /**@type {htmlCanvasElement} */
  glCanvas: null,
  /**@type {htmlCanvasElement} */
  textCanvas: null,



  // PlaneList parameters
  /**@type {number} */
  maxPlanes: 100,
  /**@type {number} */
  maxHistory: 10,
  /**@type {number} */
  historySeparationMethod: historySeparationMethod.DISTANCE,
  /**@type {number} */
  historySeparationDistanceNM: 0.5, // in nautical miles
  /**@type {number} */
  historySeparationTimeSecs: 5, // in seconds
  /**@type {boolean} */
  showHistory: true,
  /**@type {boolean} */
  removeOutOfBounds: false,
  /**@type {number} */


  // ATCMap parameters
  /**@type {number} */
  planeCircleRadius: 0.5, // in nautical miles
  /**@type {number} */
  planeCircleLineWidth: 0.1, // in nautical miles

}


export class Game {

  constructor(params) {

    const gameParams = { ...defaultParams, ...params };

    this.centre = gameParams.centre;
    this.radius = gameParams.radius;
    this.scale = gameParams.scale;

    this.planeList = new PlaneList(
      gameParams.maxPlanes,
      gameParams.maxHistory,
      gameParams.historySeparationDistanceNM,
      gameParams.removeOutOfBounds
    );

    this.planeList.setBounds(
      gameParams.centre.lat,
      gameParams.centre.lon,
      gameParams.radius
    );

    this.map = new ATCMap(
      gameParams.centre.lat,
      gameParams.centre.lon,
      gameParams.radius,
      gameParams.scale,
      gameParams.glCanvas.clientWidth,
      gameParams.glCanvas.clientHeight,

    );

    this.textCanvas = gameParams.textCanvas;
    this.canvasContext = this.textCanvas.getContext("2d");
    this.glCanvas = gameParams.glCanvas;


    // State variables
    this.pause = false;
    this.showHistory = gameParams.showHistory;

    this.height = this.glCanvas.clientHeight;
    this.width = this.glCanvas.clientWidth;
    this.radarRadius = gameParams.radius;

    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseLat = 0;
    this.mouseLon = 0;
    this.mouseDown = false;
    this.mouseDownX = 0;
    this.mouseDownY = 0;

    this.resizeTimeout = null;
    this.resizeDelay = 100;


    this.setEventHandlers();

  }

  changeCentre(lat, lon) {
    this.centre.lat = lat;
    this.centre.lon = lon;
    this.map.setCentre(lat, lon);
    this.planeList.setBounds(lat, lon, this.radarRadius);
  }

  updateMousePosition(x, y) {
    const latLon = this.map.xyToLatLon(x, y);
    document.querySelector("#mouse").innerText = `x:${x}, y:${y}`;
    document.querySelector("#mouse").innerText += ` lat:${latLon.lat.toFixed(5)}, lon:${latLon.lon.toFixed(5)}`;

    this.mouseX = x;
    this.mouseY = y;
  }

    

  handleScroll(e) {
    e.preventDefault();
    console.log("Scroll event: " + e.deltaX + " " + e.deltaY);
    const hoveredPlane = this.planeList.getHoveredPlaneImperial();
    if (hoveredPlane !== null) {
      console.log("Hovered plane: " + hoveredPlane.flightNumber);
      let index = hoveredPlane.index;
      let targetAltitude = hoveredPlane.targetAltitude;
      let targetHeading = hoveredPlane.targetHeading;
      let targetSpeed = hoveredPlane.targetSpeed;

      let adjustedX = 0;
      if (e.deltaX != 0) {
        adjustedX = 5 * e.deltaX / Math.abs(e.deltaX);
      }
      let adjustedY = 0;
      if (e.deltaY != 0) {
        adjustedY = 5 * e.deltaY / Math.abs(e.deltaY);
      }
      let altitudeChange = adjustedX;
      let headingChange = adjustedY;
      let speedChange = 0;
      if (e.shiftKey) {
        altitudeChange = adjustedY;
        headingChange = adjustedX;
      } else if (e.ctrlKey) {
        altitudeChange = 0;
        headingChange = 0;
        speedChange = adjustedY;
      }
      console.log("Altitude change: " + altitudeChange);
      console.log("Heading change: " + headingChange);
      console.log("Speed change: " + speedChange);
      this.planeList.setTargetAltitude(index, targetAltitude - altitudeChange *100);
      this.planeList.setTargetHeading(index, targetHeading + headingChange);
      this.planeList.setTargetSpeed(index, targetSpeed - speedChange);
    }
  }

  handleClick(e) {

    this.pause = !this.pause;
    if (this.pause) {
      this.textCanvas.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
    } else {
      this.textCanvas.style.cursor = "default";
      this.textCanvas.style.backgroundColor = "rgba(0, 0, 0, 0.0)";
    }
  }

  handleMouseMove(e) {
    this.updateMousePosition(e.clientX, e.clientY);

  }

  resize() {
    console.log("Resizing canvas to: " + this.glCanvas.clientWidth + "x" + this.glCanvas.clientHeight);
    this.height = this.glCanvas.clientHeight;
    this.width = this.glCanvas.clientWidth;

    utils.resizeCanvasToDisplaySize(this.glCanvas);
    utils.resizeCanvasToDisplaySize(this.textCanvas);
    this.map.setDimensions(this.width, this.height);

  }

  handleResize() {

    console.log("Resize event");
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => {
      console.log("Resize timeout fired");
      this.resizeTimeout = null;
      this.resize();
    }, this.resizeDelay);


  }

  setEventHandlers() {
    // Scrollwheel functions
    var handleScroll = this.handleScroll.bind(this);
    var handleClick = this.handleClick.bind(this);
    var handleMouseMove = this.handleMouseMove.bind(this);
    var handleResize = this.handleResize.bind(this);
    this.textCanvas.addEventListener("wheel", handleScroll);
    this.textCanvas.addEventListener("click", handleClick);
    this.textCanvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
  }


}