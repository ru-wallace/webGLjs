import { PlaneList } from "./planes.js";
import { ATCMap } from "./map.js";
import * as utils from "./utils.js";



/**
 * * @typedef {Object} GameParams
 * @property {number} [centre.lat] - Latitude of the centre of the radar
 * @property {number} [centre.lon] - Longitude of the centre of the radar
 * @property {number} [radius] - Radius of the radar in nautical miles
 * @property {number} [scale] - Scale of the radar
 * @property {htmlCanvasElement} [glCanvas] - Canvas element for the radar
 * @property {htmlCanvasElement} [textCanvas] - Canvas element for the text overlay
 * @property {string} [startTimestamp] - Timestamp to start the simulation
 * @property {number} [maxPlanes] - Maximum number of planes to display
 * @property {number} [maxHistory] - Maximum number of history points to display
 * @property {number} [historySeparationMethod] - Method to separate history points
 * @property {number} [historySeparationDistanceNM] - Distance to separate history points in nautical miles
 * @property {number} [historySeparationTimeSecs] - Time to separate history points in seconds
 * @property {boolean} [showHistory] - Whether to show history points
 * @property {boolean} [removeOutOfBounds] - Whether to remove planes out of bounds
 * @property {number} [planeCircleRadius] - Radius of the plane circle in pixels
 * @property {number} [planeCircleLineWidth] - Line width of the plane circle in pixels

 */



export const historySeparationMethod = Object.freeze({

  /**@type {number} */
  TIME: 0, // NOT IMPLEMENTED
  /**@type {number} */
  DISTANCE: 1,

});

/**
 * Default parameters for the game
 * @type {GameParams}
 */

const defaultParams = {

  // Main game parameters

  centre: {

    lat: 55.87348,

    lon: -4.43058,
  },

  radius: 24.41, //radar radius in nautical miles

  scale: 1.1, //scale (1.1 = 10% more than radar radius)

  glCanvas: null,

  textCanvas: null,

  startTimestamp: "01 Jan 2000 00:00:00 UTC", // timestamp to start, in string form (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse)



  // PlaneList parameters

  maxPlanes: 100,

  maxHistory: 10,

  historySeparationMethod: historySeparationMethod.DISTANCE,

  historySeparationDistanceNM: 0.5, // in nautical miles

  historySeparationTimeSecs: 5, // in seconds

  showHistory: true,

  removeOutOfBounds: false,



  // ATCMap parameters

  planeCircleRadius: 0.5, // in nautical miles
  planeCircleLineWidth: 0.1, // in nautical miles

};

/**
 * * @class Game
 * @classdesc Class representing the game.
 * @property {PlaneList} planeList - List of planes in the game
 * @property {ATCMap} map - Map of the game
 * @property {CanvasRenderingContext2D} canvasContext - Context of the text canvas
 
 * @property {boolean} pause - Whether the game is paused
  * @property {boolean} showHistory - Whether to show history points
  * @property {Date} startTimestamp - Timestamp to start the simulation
  * @property {Date} gameTime - Current game time
  * @property {number} height - Height of the canvas
  * @property {number} width - Width of the canvas
  * @property {number} radarRadius - Radius of the radar
  * @property {number} mouseX - X position of the mouse
  * @property {number} mouseY - Y position of the mouse
  * @property {number} mouseLat - Latitude of the mouse
  * @property {number} mouseLon - Longitude of the mouse
  * @property {boolean} mouseDown - Whether the mouse is down
  * @property {number} mouseDownX - X position of the mouse when down
  * @property {number} mouseDownY - Y position of the mouse when down
  * @property {number} resizeTimeout - Timeout function for resizing the canvas
  * @property {number} resizeDelay - Delay for resizing the canvas
  * @property {number} simulationSpeed - Speed of the simulation
  * @property {number} simulationSpeedMax - Maximum speed of the simulation
  * @property {number} simulationSpeedMin - Minimum speed of the simulation
  
 */
export class Game
{



  constructor(params)
  {

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
    this.startTimestamp = Date.parse(gameParams.startTimestamp);
    /**@type {Date} */
    this.gameTime = this.startTimestamp;

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

    /**@type {number}*/
    this.resizeTimeout = null;
    /**@type {number}*/
    this.resizeDelay = 100;

    /**@type {number}*/
    this.simulationSpeed = 1; // time multiplier for simulation speed
    /**@type {number}*/
    this.simulationSpeedMax = 64; // maximum simulation speed
    /**@type {number}*/
    this.simulationSpeedMin = 0.25; // minimum simulation speed
    document.querySelector("#sim-speed").innerText = this.simulationSpeed.toFixed(2);

    this.setEventHandlers();

  }

  setTime(timestamp)
  { //timestamp in string format
    try
    {
      const unixTime = Date.parse(timestamp);
      if (unixTime !== null)
      {
        this.gameTime = unixTime;
      }
    } catch (error)
    {

      console.error(`Could not parse timestamp: '${timestamp}'.`);
      console.error(error);

    }
  }

  /**
   * @function getTimeString
   * @description Get the current game time as a string
   * @returns {string} - Current game time
   */
  getTimeString()
  {
    return this.gameTime.toUTCString();
  }

  updateTime(deltaTime)
  {
    this.gameTime += deltaTime * 1000 * this.simulationSpeed; // convert to milliseconds
    const date = new Date(this.gameTime);
    document.querySelector("#time").innerText = date.toUTCString();
  }


  tick(deltaTime)
  {
    if (!this.pause)
    {
      this.updateTime(deltaTime);
      this.planeList.updateAllPlanes(deltaTime*this.simulationSpeed); // update all planes
    }
    const selectedPlaneIndex = this.planeList.getSelectedPlaneIndex();
    if (selectedPlaneIndex !== -1)
    {
      this.planeList.updatePlaneInfoHTML(selectedPlaneIndex, "hovered-plane"); // update selected plane display on sidebar
    } else
    {

      const hoveredPlaneIndex = this.planeList.getHoveredPlaneIndex();
      if (hoveredPlaneIndex !== -1)
      {
        this.planeList.updatePlaneInfoHTML(hoveredPlaneIndex, "hovered-plane"); // update hovered plane display on sidebar
      } else
      {
        this.planeList.clearPlaneInfoHTML("hovered-plane");
      }
    }
  }



  /**
   * @function changeCentre
   * @param {number} lat 
   * @param {number} lon 
   */

  changeCentre(lat, lon)
  {
    this.centre.lat = lat;
    this.centre.lon = lon;
    this.map.setCentre(lat, lon);
    this.planeList.setBounds(lat, lon, this.radarRadius);
  }

  /**
   * @function updateMousePosition
   * @param {*} x 
   * @param {*} y 
   */
  updateMousePosition(x, y)
  {
    const latLon = this.map.xyToLatLon(x, y);
    document.querySelector("#mouse").innerText = `x:${x}, y:${y}`;
    document.querySelector("#mouse").innerText += ` lat:${latLon.lat.toFixed(5)}, lon:${latLon.lon.toFixed(5)}`;

    this.mouseX = x;
    this.mouseY = y;
  }


  /**
   *
   * @param {Event} e
   * @returns {undefined}
   */
  handleScroll(e)
  {
    e.preventDefault();
    console.log("Scroll event: " + e.deltaX + " " + e.deltaY);
    const hoveredPlane = this.planeList.getHoveredPlaneImperial();
    if (hoveredPlane !== null)
    {
      console.log("Hovered plane: " + hoveredPlane.callSign);
      let index = hoveredPlane.index;
      let targetAltitude = hoveredPlane.targetAltitude;
      let targetHeading = hoveredPlane.targetHeading;
      let targetSpeed = hoveredPlane.targetSpeed;

      let adjustedX = 0;
      if (e.deltaX != 0)
      {
        adjustedX = 5 * e.deltaX / Math.abs(e.deltaX);
      }
      let adjustedY = 0;
      if (e.deltaY != 0)
      {
        adjustedY = 5 * e.deltaY / Math.abs(e.deltaY);
      }
      let altitudeChange = adjustedX;
      let headingChange = adjustedY;
      let speedChange = 0;
      if (e.shiftKey)
      {
        altitudeChange = adjustedY;
        headingChange = adjustedX;
      } else if (e.ctrlKey)
      {
        altitudeChange = 0;
        headingChange = 0;
        speedChange = adjustedY;
      }
      console.log("Altitude change: " + altitudeChange);
      console.log("Heading change: " + headingChange);
      console.log("Speed change: " + speedChange);
      this.planeList.setTargetAltitude(index, targetAltitude - altitudeChange * 20);
      this.planeList.setTargetHeading(index, targetHeading + headingChange);
      this.planeList.setTargetSpeed(index, targetSpeed - speedChange);
    }
  }


  togglePause(e)
  {

    this.pause = !this.pause;
    if (this.pause)
    {
      this.textCanvas.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
    } else
    {
      this.textCanvas.style.cursor = "default";
      this.textCanvas.style.backgroundColor = "rgba(0, 0, 0, 0.0)";
    }
  }

  increaseSimulationSpeed()
  {
    this.simulationSpeed = Math.min(this.simulationSpeed * 2, this.simulationSpeedMax);
    document.querySelector("#sim-speed").innerText = this.simulationSpeed.toFixed(2);
  }

  decreaseSimulationSpeed()
  {
    this.simulationSpeed = Math.max(this.simulationSpeed / 2, this.simulationSpeedMin);
    document.querySelector("#sim-speed").innerText = this.simulationSpeed.toFixed(2);
  }

  handleMouseMove(e)
  {
    const xPos = e.clientX - this.textCanvas.getBoundingClientRect().left;
    const yPos = e.clientY - this.textCanvas.getBoundingClientRect().top;
    this.updateMousePosition(xPos, yPos);

  }

  handleClick(e)
  {
    if (this.planeList.getHoveredPlaneIndex() !== -1)
    {
      this.planeList.selectPlane(this.planeList.getHoveredPlaneIndex());
    } else
    {
      this.planeList.deselectPlane();
    }
  }


  resize()
  {
    console.log("Resizing canvas to: " + this.glCanvas.clientWidth + "x" + this.glCanvas.clientHeight);
    this.height = this.glCanvas.clientHeight;
    this.width = this.glCanvas.clientWidth;

    utils.resizeCanvasToDisplaySize(this.glCanvas);
    utils.resizeCanvasToDisplaySize(this.textCanvas);
    this.map.setDimensions(this.width, this.height);

  }

  handleKeyUp(e)
  {
    console.log("Key up event: " + e.key);
    if (e.key === " " || e.yey === "Space")
    {
      this.togglePause(e);
    } else if (e.key === "h")
    {
      this.showHistory = !this.showHistory;
    } else if (e.key === ",")
    {
      this.decreaseSimulationSpeed();
    } else if (e.key === ".")
    {
      this.increaseSimulationSpeed();
    }


  }

  handleResize()
  {

    console.log("Resize event");
    if (this.resizeTimeout)
    {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() =>
    {
      console.log("Resize timeout fired");
      this.resizeTimeout = null;
      this.resize();
    }, this.resizeDelay);


  }

  setEventHandlers()
  {
    // Scrollwheel functions
    var handleScroll = this.handleScroll.bind(this);
    var handleKeyUp = this.handleKeyUp.bind(this);
    var handleMouseMove = this.handleMouseMove.bind(this);
    var handleResize = this.handleResize.bind(this);
    var handleClick = this.handleClick.bind(this);
    this.textCanvas.addEventListener("wheel", handleScroll);
    document.addEventListener("keyup", handleKeyUp);
    this.textCanvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    this.textCanvas.addEventListener("click", handleClick);
  }


}