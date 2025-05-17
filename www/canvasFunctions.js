import * as convert from "./conversions.js";
import * as geom from "./geometryFunctions.js";

export class Canv {
  constructor(canvas, map, fontSize, fontFace, color, textAlign) {
    this.canvas = canvas;
    this.map = map;
    this.context = canvas.getContext("2d");
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;

    this.fontSize = fontSize;
    this.fontFace = fontFace;
    this.color = color;
    if (textAlign === undefined) {
      textAlign = this.context.textAlign;
    }
    this.textAlign = textAlign;
    this.textBaseline = this.context.textBaseline;

    this.planeTextOffset = {
      x: 10,
      y: 0,
    };

    this.navAidTextOffset = {
      x: 10,
      y: 10,
    };
    this.updateFont();
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  updateFont() {
    this.context.font = `${this.fontSize}px ${this.fontFace}`;
    this.context.fillStyle = this.color;
    this.context.textAlign = this.textAlign;
    this.context.textBaseline = this.textBaseline;
  }
  setFontFace(fontFace) {
    this.fontFace = fontFace;
    this.updateFont();
  }
  setFontSize(fontSize) {
    this.fontSize = fontSize;
    this.updateFont();
  }
  setColor(color) {
    this.color = color;
    this.updateFont();
  }
  setTextAlign(textAlign) {
    this.textAlign = textAlign;
    this.updateFont();
  }
  setTextBaseline(textBaseline) {
    this.textBaseline = textBaseline;
    this.updateFont();
  }

  drawPlaneText(plane) {
    const planePosition = this.map.latLonToXY(plane.latitude, plane.longitude);
    const anchorX = planePosition.x + this.planeTextOffset.x;
    const anchorY = planePosition.y + this.planeTextOffset.y;
    this.context.font = `${this.fontSize}px ${this.fontFace}`;
    this.context.fillStyle = this.color;
    this.context.fillText(plane.callSign, anchorX, anchorY);
    this.context.fillText(plane.type, anchorX, anchorY + this.fontSize);
    let speedText = Math.round(convert.metresPerSecondToKts(plane.speed)) + "KTS";


    if (Math.abs(plane.speed - plane.targetSpeed) > 0.1) {
      speedText += "=>" + Math.round(convert.metresPerSecondToKts(plane.targetSpeed)) + "KTS";
    }
    this.context.fillText(speedText, anchorX, anchorY + this.fontSize * 2);
    

  
  
    const flightLevel = Math.round(convert.metresToFeet(plane.altitude) / 100);
    let flightLevelText = "FL" + flightLevel.toFixed(0);
    const targetFlightLevel = Math.round(convert.metresToFeet(plane.targetAltitude) / 100);
    if (flightLevel != targetFlightLevel) {
      flightLevelText += "=>" + targetFlightLevel + " (";
      flightLevelText += Math.round(convert.metresPerSecondToFeetPerMinute(plane.verticalSpeed)) + "FPM)";
    }
    this.context.fillText(flightLevelText, anchorX, anchorY + this.fontSize * 3);
  
    const heading = Math.round(plane.heading);
    let headingText = heading + "\u{00b0}";
    const targetHeading = Math.round(plane.targetHeading);
    if (heading != targetHeading) {
      headingText += "=>" + targetHeading + "\u{00b0}";
    }
    this.context.fillText(headingText, anchorX, anchorY + this.fontSize * 5);
  
  }  

  drawNavAidText(navAid) {
    const navAidPosition = this.map.latLonToXY(navAid.latitude, navAid.longitude);

    if (navAid.labelDirection === undefined) {
      navAid.labelDirection = 'se';
    }

    const offset = {
      x: this.navAidTextOffset.x,
      y: this.navAidTextOffset.y,
    }
    navAid.labelDirection = navAid.labelDirection.toLowerCase() || 'se';

    if (navAid.labelDirection.includes('n')) {
      this.context.textBaseline = "bottom";
      offset.y = -offset.y;
    // } else if (navAid.labelDirection.includes('s')) {
    //   this.context.textBaseline = "top";
    }
    if (navAid.labelDirection.includes('e')) {
      this.context.textAlign = "left";
    } else if (navAid.labelDirection.includes('w')) {
      this.context.textAlign = "right";

      offset.x = -offset.x;
    }

    const anchorX = navAidPosition.x + offset.x;
    const anchorY = navAidPosition.y + offset.y;
    this.context.font = `${this.fontSize}px ${this.fontFace}`;
    this.context.fillStyle = this.color;
    this.context.fillText(navAid.name, anchorX, anchorY);
  }
}


export function drawPlaneText(textContext, plane) {
  const planePosition = map.latLonToXY(plane.latitude, plane.longitude);
  const anchorX = planePosition.x + PLANE_TEXT_OFFSET_X;
  const anchorY = planePosition.y + PLANE_TEXT_OFFSET_Y;
  textContext.font = `${PLANE_TEXT_FONT_SIZE}px ${PLANE_TEXT_FONT_FACE}`;
  textContext.fillStyle = PLANE_TEXT_COLOR;
  textContext.fillText(plane.callSign, anchorX,anchorY);
  textContext.fillText(plane.type, anchorX, anchorY + PLANE_TEXT_FONT_SIZE);
  let speedText = Math.round(plane.speed) + "KTS";
  if (Math.abs(plane.speed - plane.targetSpeed) > 0.1) {
    speedText += "=>" + Math.round(plane.targetSpeed) + "KTS";
  }
  textContext.fillText(speedText, anchorX, anchorY + PLANE_TEXT_FONT_SIZE*2);


  const flightLevel = Math.round(plane.altitude / 100);
  let flightLevelText = "FL" + flightLevel.toFixed(0);
  const targetFlightLevel = Math.round(plane.targetAltitude / 100);
  if (flightLevel != targetFlightLevel) {
    flightLevelText += "=>" + targetFlightLevel + " ()";
    flightLevelText += Math.round(plane.verticalSpeed) + "FPM)";
  }
  textContext.fillText(flightLevelText, anchorX, anchorY + PLANE_TEXT_FONT_SIZE*3);

  const heading = Math.round(plane.heading);
  let headingText = heading + "\u{00b0}";
  const targetHeading = Math.round(plane.targetHeading);
  if (heading != targetHeading) {
    headingText += "=>" + targetHeading + "\u{00b0}";
  }
  textContext.fillText(headingText, anchorX, anchorY + PLANE_TEXT_FONT_SIZE*5);

  
}

