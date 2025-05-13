import * as convert from "./conversions.js";
import * as geom from "./geometryFunctions.js";
import { PositionHistory } from "./positionHistory.js";
export const EARTH_RADIUS_NAUTICAL_MILES = 3440.065; // in nautical miles
export const FEET_TO_NAUTICAL_MILES = 1 / 6076.11549; // conversion factor from feet to nautical miles

const FLIGHT_LEVEL_MIN = 1800; // in feet
const FLIGHT_LEVEL_MAX = 10000; // in feet

const MAX_SPEED_KTS = 300; // Maximum speed in knots
const MIN_SPEED_KTS = 180; // Minimum speed in knots

const MAX_SPEED_MPS = convert.ktsToMetresPerSecond(MAX_SPEED_KTS); // Maximum speed in metres per second
const MIN_SPEED_MPS = convert.ktsToMetresPerSecond(MIN_SPEED_KTS); // Minimum speed in metres per second

const MAX_TURN_RATE = 3; // Degrees per second
const PLANE_MAX_VERTICAL_G_FORCE = 2; // Maximum vertical G-force
const PLANE_MIN_VERTICAL_G_FORCE = 0.75; // Minimum vertical G-force


const VERTICAL_POSITIVE_ACCELERATION_MPS2 = convert.gForceToVerticalAcceleration(PLANE_MAX_VERTICAL_G_FORCE, true);// Maximum vertical positive acceleration in metres per second squared
const VERTICAL_NEGATIVE_ACCELERATION_MPS2 = convert.gForceToVerticalAcceleration(PLANE_MIN_VERTICAL_G_FORCE, true); // Maximum vertical negative acceleration in metres per second squared

const PLANE_MAX_HORIZONTAL_G_FORCE = 0.3; // Maximum horizontal G-force

const HORIZONTAL_ACCELERATION_MPS2 = convert.gForceToMetresPerSecondSquared(PLANE_MAX_HORIZONTAL_G_FORCE)  // Maximum horizontal acceleration in metres per second squared

const MAX_CLIMB_RATE = convert.feetPerMinuteToMetresPerSecond(2000); // Maximum climb rate in feet per minute
const MAX_DESCENT_RATE = convert.feetPerMinuteToMetresPerSecond(2000); // Maximum descent rate in feet per minute
class PlaneList {
    altitudes = []; //metres
    targetAltitudes = []; //metres
    latitudes = [];
    longitudes = [];
    speeds = []; //metres per second
    targetSpeeds = []; //metres per second
    headings = []; //compass degrees
    targetHeadings = []; //compass degrees
    verticalSpeeds = []; //metres per second
    flightNumbers = [];
    types = [];
    squawks = [];
    positionHistories = []; // array of PositionHistory objects
    indexLookup = {}; // lookup table for flight numbers to indices
    nPlanes = 0; // number of planes in the list
    maxPlanes = 0; // maximum number of planes in the list
    removeOutOfBounds = false; // remove planes out of bounds
    boundsRadius = 10000000;
    boundsCenter = { lat: 0, lon: 0 };
    selectedPlaneIndex = -1; // index of the selected plane
    minimumVerticalSeparation = convert.feetToMetres(1000); // minimum vertical separation in feet
    minimumHorizontalSeparation = convert.nauticalMilesToMetres(3); // minimum horizontal separation in nautical miles

    constructor(maxPlanes, maxHistory, historyDistanceNM, removeOutOfBounds=false) {
        this.maxPlanes = maxPlanes;
        this.nPlanes = 0;
        this.altitudes = new Array(maxPlanes);
        this.latitudes = new Array(maxPlanes);
        this.longitudes = new Array(maxPlanes);
        this.speeds = new Array(maxPlanes);
        this.headings = new Array(maxPlanes);
        this.verticalSpeeds = new Array(maxPlanes);
        this.flightNumbers = new Array(maxPlanes);
        this.types = new Array(maxPlanes);
        this.squawks = new Array(maxPlanes);
        this.positionHistories = new Array(maxPlanes);
        this.indexLookup = {}; // lookup table for flight numbers to indices
        this.maxHistory = maxHistory; // maximum number of history points for each plane
        this.historyDistance = convert.nauticalMilesToMetres(historyDistanceNM); // minimum distance to add a new position to the history
        this.removeOutOfBounds = removeOutOfBounds; // remove planes out of bounds
        this.boundsRadius = 0; // in metres
        this.boundsCenter = { lat: 0, lon: 0 }; // center of the radar in degrees
        this.minimumVerticalSeparation = convert.feetToMetres(1000); // minimum vertical separation in feet
        this.minimumHorizontalSeparation = convert.nauticalMilesToMetres(3); // minimum horizontal separation in nautical miles
        this.selectedPlaneIndex = -1; // index of the selected plane
        this.hoveredPlaneIndex = -1; // index of the hovered plane
        console.log("PlaneList created");
        console.log("Max planes: " + maxPlanes);
        console.log("Max history: " + maxHistory);
        console.log("History distance: " + historyDistanceNM);
        console.log("Remove out of bounds: " + removeOutOfBounds);
        console.log("Bounds radius: " + this.boundsRadius);
        console.log("Bounds center: " + this.boundsCenter.lat + ", " + this.boundsCenter.lon);

    };

    selectPlane(index) {
        if (index >= 0 && index < this.nPlanes) {
            this.selectedPlaneIndex = index; // set selected plane index
        } else {
            console.log("Invalid index. Cannot select plane.");
        }
    }
    deselectPlane() {
        this.selectedPlaneIndex = -1; // deselect plane
    }
    getSelectedPlane() {
        if (this.selectedPlaneIndex >= 0 && this.selectedPlaneIndex < this.nPlanes) {
            return this.getPlaneByIndex(this.selectedPlaneIndex); // return selected plane
        } else {
            return null; // no plane selected
        }
    }

    getSelectedPlaneIndex() {
        return this.selectedPlaneIndex; // return selected plane index
    }

    isSelectedPlane(index) {
        return this.selectedPlaneIndex === index; // return true if the plane is selected
    }

    setHoveredPlane(index) {
        if (index < this.nPlanes) {
            this.hoveredPlaneIndex = index; // set hovered plane index
        } else {
            this.hoveredPlaneIndex = -1; // no plane hovered
            console.log("Invalid index: " + index + ". Cannot set hovered plane.");
        }
    }

    getHoveredPlane() {
        if (this.hoveredPlaneIndex >= 0 && this.hoveredPlaneIndex < this.nPlanes) {
            return this.getPlaneByIndex(this.hoveredPlaneIndex); // return hovered plane
        } else {
            return null; // no plane hovered
        }
    }

    getHoveredPlaneImperial() {
        if (this.hoveredPlaneIndex >= 0 && this.hoveredPlaneIndex < this.nPlanes) {
            var plane = this.getPlaneByIndexImperial(this.hoveredPlaneIndex); // return hovered plane
            return plane;
        } else {
            return null; // no plane hovered
        }
    }
    getHoveredPlaneIndex() {
        return this.hoveredPlaneIndex; // return hovered plane index
    }

    isHoveredPlane(index) {
        return this.hoveredPlaneIndex === index; // return true if the plane is hovered
    }



    getNearestPlane(lat, lon) {
        var nearestPlaneIndex = -1;
        var nearestPlaneDistance = Number.MAX_VALUE; // set to maximum value
        for (var i = 0; i < this.nPlanes; i++) {
            var distance = geom.calculateDistance(lat, lon, this.latitudes[i], this.longitudes[i]); // calculate distance from point to plane
            if (distance < nearestPlaneDistance) {
                nearestPlaneDistance = distance; // set new minimum distance
                nearestPlaneIndex = i; // set new nearest plane index
            }
        }
        if (nearestPlaneIndex >= 0 && nearestPlaneIndex < this.nPlanes) {
            return {
                index: nearestPlaneIndex,
                distance: nearestPlaneDistance,
            }
        } else {
            return null; // no plane found
        }   
    }


    updatePlane(index, deltaTime) {
        var vSpeed = this.verticalSpeeds[index]; 
        var hSpeed = this.speeds[index];
      

        var altChange = vSpeed * deltaTime; // change in altitude 
        
        var newAltitude = this.altitudes[index] + altChange; // new altitude in feet

        var middleAltitude = (this.altitudes[index] + newAltitude) / 2; // average altitude in feet

        const newLatLon = geom.calculateDestination(this.latitudes[index], this.longitudes[index], hSpeed * deltaTime, this.headings[index], middleAltitude); // calculate new latitude and longitude
        
        
        this.altitudes[index] = newAltitude; // update altitude
        this.latitudes[index] = newLatLon.lat; // update latitude
        this.longitudes[index] = newLatLon.lon; // update longitude

        
        this.positionHistories[index].addPositionIfFurtherThanMin(this.latitudes[index], this.longitudes[index], this.historyDistance); // add position to history if further than min distance

        if (!this.checkBounds(index, this.removeOutOfBounds)) {
            return; // if the plane is out of bounds, return
        }

        // go towards target altitude, speed and heading
        if (this.targetAltitudes[index] !== undefined && this.targetAltitudes[index] !== null) {
            if (this.targetAltitudes[index] > this.altitudes[index]) {
                this.verticalSpeeds[index] = Math.min(this.verticalSpeeds[index] + VERTICAL_POSITIVE_ACCELERATION_MPS2 * deltaTime, MAX_CLIMB_RATE); // increase vertical speed to climb
            } else if (this.targetAltitudes[index] < this.altitudes[index]) {
                this.verticalSpeeds[index] = Math.max(this.verticalSpeeds[index] - VERTICAL_NEGATIVE_ACCELERATION_MPS2 * deltaTime, -MAX_DESCENT_RATE); // decrease vertical speed to descend
            } else {
                this.verticalSpeeds[index] = 0; // stop climbing or descending
            }
        }
        if (this.targetSpeeds[index] !== undefined && this.targetSpeeds[index] !== null) {
            if (this.targetSpeeds[index] > this.speeds[index]) {
                this.speeds[index] = Math.min(this.speeds[index] + HORIZONTAL_ACCELERATION_MPS2 * deltaTime, this.targetSpeeds[index]); // increase speed to target speed
            } else if (this.targetSpeeds[index] < this.speeds[index]) {
                this.speeds[index] = Math.max(this.speeds[index] - HORIZONTAL_ACCELERATION_MPS2 * deltaTime, this.targetSpeeds[index]); // decrease speed to target speed
            } else {
                this.speeds[index] = this.targetSpeeds[index]; // stop accelerating or decelerating
            }
        }
        if (this.targetHeadings[index] !== undefined && this.targetHeadings[index] !== null) {
            var headingDiff = this.targetHeadings[index] - this.headings[index]; // difference in headings
            if (headingDiff > 180) {
                headingDiff -= 360; // wrap around
            } else if (headingDiff < -180) {
                headingDiff += 360; // wrap around
            }
            if (headingDiff > MAX_TURN_RATE * deltaTime) {
                this.headings[index] += MAX_TURN_RATE * deltaTime; // turn right
            } else if (headingDiff < -MAX_TURN_RATE * deltaTime) {
                this.headings[index] -= MAX_TURN_RATE * deltaTime; // turn left
            } else {
                this.headings[index] = this.targetHeadings[index]; // stop turning
            }
            if (this.headings[index] > 360) {
                this.headings[index] -= 360; // wrap around
            }
            else if (this.headings[index] < 0) {
                this.headings[index] += 360; // wrap around
            }
        }

    }

    checkBounds(index, deleteifOutOfBounds = false) {
        if (index < 0 || index >= this.nPlanes) {
            return null;
        }
        

        var dist = geom.calculateDistance(this.latitudes[index], this.longitudes[index], this.boundsCenter.lat, this.boundsCenter.lon); // calculate distance from center of bounds
        const inBounds = dist < this.boundsRadius;

        if (!inBounds) {
            console.log("Plane out of bounds: " + this.flightNumbers[index] + " at index " + index);
            console.log("Distance: " + convert.metresToNauticalMiles(dist) + "nm, bounds radius: " + convert.metresToNauticalMiles(this.boundsRadius) + "NM");
            console.log("Bounds center: " + this.boundsCenter.lat + ", " + this.boundsCenter.lon);
            console.log("Plane position: " + this.latitudes[index] + ", " + this.longitudes[index]);
            if (deleteifOutOfBounds) {
                console.log("Removing...");
                this.removePlane(index); // remove plane from list
            }
        }

        return inBounds;
    }
        

    updateAllPlanes(deltaTime) {
        for (var i = 0; i < this.nPlanes; i++) {
            this.updatePlane(i, deltaTime); // update each plane
        }
    }

    setTargetFlightLevel(index, setTargetFlightLevel) {
        if (index >= 0 && index < this.nPlanes) {
            this.setTargetAltitude(index, setTargetFlightLevel * 100); // set target altitude to current altitude
        } else {
            console.log("Invalid index. Cannot set target flight level.");
        }
    }
    setTargetAltitude(index, targetAltitudeFt) {
        if (index >= 0 && index < this.nPlanes) {
            targetAltitudeFt = Math.max(FLIGHT_LEVEL_MIN, Math.min(FLIGHT_LEVEL_MAX * 100, targetAltitudeFt)); // limit altitude to between 1800 and FL410
            this.targetAltitudes[index] = convert.feetToMetres(targetAltitudeFt); // set target altitude to current altitude
            console.log("Set target altitude: " + targetAltitudeFt + "ft for plane: " + this.flightNumbers[index]);
        } else {
            console.log("Invalid index. Cannot set target altitude.");
        }
    }
    setTargetSpeed(index, targetSpeedKts) {
        if (index >= 0 && index < this.nPlanes) {
            targetSpeedKts = Math.max(MIN_SPEED_KTS, Math.min(MAX_SPEED_KTS, targetSpeedKts)); // limit speed to between 180 and 300 knots
            this.targetSpeeds[index] = convert.ktsToMetresPerSecond(targetSpeedKts); // set target speed to current speed
            console.log("Set target speed: " + targetSpeedKts + "kts for plane: " + this.flightNumbers[index]);
        } else {
            console.log("Invalid index. Cannot set target speed.");
        }
    }
    setTargetHeading(index, targetHeading) {
        if (targetHeading > 360) {
            targetHeading -= 360; // wrap around
        } else if (targetHeading < 0) {
            targetHeading += 360; // wrap around
        }
        if (index >= 0 && index < this.nPlanes) {
            this.targetHeadings[index] = targetHeading; // set target heading to current heading
        } else {
            console.log("Invalid index. Cannot set target heading.");
        }
    }
    setTargetParams(index, targetAltitudeFt, targetSpeedKts, targetHeading) {

        if (index >= 0 && index < this.nPlanes) {
            if (targetAltitudeFt) this.targetAltitudes[index] = targetAltitudeFt; // set target altitude to current altitude
            if (targetSpeedKts) this.targetSpeeds[index] = targetSpeedKts; // set target speed to current speed
            if (targetHeading) {
                if (targetHeading > 360) {
                    targetHeading -= 360; // wrap around
                } else if (targetHeading < 0) {
                    targetHeading += 360; // wrap around
                }
                this.targetHeadings[index] = targetHeading; // set target heading to current heading
            }
        } else {
            console.log("Invalid index. Cannot set target params.");
        }
    }

    setBounds(lat, lon, radiusNM) {
        this.boundsCenter.lat = lat;
        this.boundsCenter.lon = lon;
        this.boundsRadius = convert.nauticalMilesToMetres(radiusNM); // in metres

    }

    setBoundsRadius(radiusNM) {
        this.boundsRadius = convert.nauticalMilesToMetres(radiusNM); // in metres
    }
    setBoundsCenter(lat, lon) {
        this.boundsCenter.lat = lat;
        this.boundsCenter.lon = lon;
    }

    checkUniqueFlightNumber(flightNumber) {
        if (this.indexLookup[flightNumber] !== undefined) {
            console.log("Flight number " + flightNumber + " already exists at index " + this.indexLookup[flightNumber]);
            return false; // flight number already exists
        }
        return true; // flight number is unique
    }

    getTurnRadius(index) {
        const turnTime90 = 90 / MAX_TURN_RATE; // time to turn 90 degrees
        const turnCircumference = this.speeds[index] * turnTime90 * 4; // circumference of turn
        const turnRadius = turnCircumference / (2 * Math.PI); // radius of turn
        return turnRadius; // return radius of turn

    addPlane(flightNumber, type, squawk, latitude, longitude, altitudeFt, speedKts, heading, verticalSpeedFpM) {
        if (this.nPlanes >= this.maxPlanes) {
            console.log("Plane list is full. Cannot add more planes.");
            return;
        }

        if (!this.checkUniqueFlightNumber(flightNumber)) {
            console.log("Flight number " + flightNumber + " already exists. Cannot add plane.");
            return;
        }
        this.flightNumbers[this.nPlanes] = flightNumber;
        this.types[this.nPlanes] = type;
        this.squawks[this.nPlanes] = squawk;
        this.latitudes[this.nPlanes] = latitude;
        this.longitudes[this.nPlanes] = longitude;
        this.altitudes[this.nPlanes] = convert.feetToMetres(altitudeFt);
        this.targetAltitudes[this.nPlanes] = this.altitudes[this.nPlanes]; // set target altitude to current altitude
        this.speeds[this.nPlanes] = convert.ktsToMetresPerSecond(speedKts)
        this.targetSpeeds[this.nPlanes] = this.speeds[this.nPlanes]; // set target speed to current speed
        this.headings[this.nPlanes] = heading;
        this.targetHeadings[this.nPlanes] = heading; // set target heading to current heading
        this.verticalSpeeds[this.nPlanes] = convert.feetPerMinuteToMetresPerSecond(verticalSpeedFpM);
        this.indexLookup[flightNumber] = this.nPlanes ; // add to lookup table
        this.positionHistories[this.nPlanes] = new PositionHistory(this.maxHistory);
        this.positionHistories[this.nPlanes].addPosition(latitude, longitude); // add initial position to history
        console.log("Added plane: " + flightNumber + " at index " + (this.nPlanes));
        this.nPlanes++;
        return this.nPlanes - 1; // return index of new plane
    }

    addRandomPlane(flightNumber, type, squawk) {
        let randomDirection = Math.round(Math.random() * 360);
        let randomRadius = Math.round(Math.random() * this.boundsRadius);
        let randomLatLon = geom.calculateDestination(this.boundsCenter.lat, this.boundsCenter.lon, randomRadius, randomDirection);
        let randomHeading = Math.round(Math.random() * 360);
        let randomSpeed = Math.round(Math.random() * (MAX_SPEED_KTS-MIN_SPEED_KTS)) + MIN_SPEED_KTS;
        let randomAltitude = Math.round(Math.random() * (FLIGHT_LEVEL_MAX-FLIGHT_LEVEL_MIN)) + FLIGHT_LEVEL_MIN;
        return this.addPlane(flightNumber, type, squawk, randomLatLon.lat, randomLatLon.lon, randomAltitude, randomSpeed, randomHeading, 0); // add plane with random parameters
    }

    removePlane(index) {
        if (index >= 0 && index < this.nPlanes) {
            delete this.indexLookup[this.flightNumbers[index]]; // remove from lookup table

            if (this.isSelectedPlane(index)) {
                this.deselectPlane(); // deselect plane if it is selected
            }
            // replace the plane at the index with the last plane in the list (saves moving all planes in memory)
            this.flightNumbers[index] = this.flightNumbers[this.nPlanes - 1];
            this.targetAltitudes[index] = this.targetAltitudes[this.nPlanes - 1];
            this.types[index] = this.types[this.nPlanes - 1];
            this.squawks[index] = this.squawks[this.nPlanes - 1];
            this.latitudes[index] = this.latitudes[this.nPlanes - 1];
            this.longitudes[index] = this.longitudes[this.nPlanes - 1];
            this.altitudes[index] = this.altitudes[this.nPlanes - 1];
            this.speeds[index] = this.speeds[this.nPlanes - 1];
            this.targetSpeeds[index] = this.targetSpeeds[this.nPlanes - 1];
            this.headings[index] = this.headings[this.nPlanes - 1];
            this.targetHeadings[index] = this.targetHeadings[this.nPlanes - 1];
            this.verticalSpeeds[index] = this.verticalSpeeds[this.nPlanes - 1];
            this.positionHistories[index] = this.positionHistories[this.nPlanes - 1]; // move the position history to the new index

            this.indexLookup[this.flightNumbers[index]] = index; // update lookup table

            this.nPlanes--;

            this.flightNumbers[this.nPlanes] = null;
            this.types[this.nPlanes] = null;
            this.squawks[this.nPlanes] = null;
            this.latitudes[this.nPlanes] = null;
            
            this.longitudes[this.nPlanes] = null;
            this.altitudes[this.nPlanes] = null;
            this.targetAltitudes[this.nPlanes] = null;
            this.speeds[this.nPlanes] = null;
            this.targetSpeeds[this.nPlanes] = null;
            this.headings[this.nPlanes] = null;
            this.targetHeadings[this.nPlanes] = null;
            this.verticalSpeeds[this.nPlanes] = null;
            this.positionHistories[this.nPlanes] = null; // remove the last plane from the list


            
        } else {
            console.log("Invalid index. Cannot remove plane.");
        }
    }

    getPlaneIndex(flightNumber) {
        return this.indexLookup[flightNumber]; // returns -1 if not found
    }

    getPlaneByIndex(index) {
        if (index >= 0 && index < this.nPlanes) {
            return {
                index: index,
                flightNumber: this.flightNumbers[index],
                type: this.types[index],
                squawk: this.squawks[index],
                latitude: this.latitudes[index],
                longitude: this.longitudes[index],
                altitude: this.altitudes[index],
                targetAltitude: this.targetAltitudes[index],
                speed: this.speeds[index],
                targetSpeed: this.targetSpeeds[index],
                heading: this.headings[index],
                targetHeading: this.targetHeadings[index],
                verticalSpeed: this.verticalSpeeds[index],
                positionHistory: this.positionHistories[index] // return the history array
            };
        } else {
            return null;
        }
    }
    getPlaneByFlightNumber(flightNumber) {
        var index = this.getPlaneIndex(flightNumber);
        return this.getPlaneByIndex(index);

    }

    getPlaneByIndexImperial(index) {
        var plane = this.getPlaneByIndex(index);
        plane.altitude = convert.metresToFeet(plane.altitude);
        plane.targetAltitude = convert.metresToFeet(plane.targetAltitude);
        plane.speed = convert.metresPerSecondToKts(plane.speed);
        plane.targetSpeed = convert.metresPerSecondToKts(plane.targetSpeed);
        plane.verticalSpeed = convert.metresPerSecondToFeetPerMinute(plane.verticalSpeed);
        return plane;

    }

    getPlaneByFlightNumberImperial(flightNumber) {
        var index = this.getPlaneIndex(flightNumber);
        var plane = this.getPlaneByIndexImperial(index);
        return plane;
    }

    // setPlaneParams(params) {
    //     var index = this.getPlaneIndex(params.flightNumber);
    //     if (index >= 0 && index < this.nPlanes) {
    //         if (params.type) this.types[index] = params.type;
    //         if (params.squawk) this.squawks[index] = params.squawk;
    //         if (params.latitude) this.latitudes[index] = params.latitude;
    //         if (params.longitude) this.longitudes[index] = params.longitude;
    //         if (params.altitude) this.altitudes[index] = params.altitude;
    //         if (params.speed) this.speeds[index] = params.speed;
    //         if (params.heading) this.headings[index] = params.heading;
    //         if (params.verticalSpeed) this.verticalSpeeds[index] = params.verticalSpeed;
    //     } else {
    //         console.log("Invalid index. Cannot update plane.");
    //     }
    // }

    calculateHorizontalSeparation(index1, index2) {
        if (index1 >= 0 && index1 < this.nPlanes && index2 >= 0 && index2 < this.nPlanes) {
            var lat1 = this.latitudes[index1];
            var lon1 = this.longitudes[index1];
            var lat2 = this.latitudes[index2];
            var lon2 = this.longitudes[index2];
            return geom.calculateDistance(lat1, lon1, lat2, lon2); // in nautical miles
        } else {
            console.log("Invalid index. Cannot calculate horizontal separation.");
            return null;
        }
    }

    getPlanesWithinVerticalSeparation(index1, verticalSeparationMetres) {
        if (index1 >= 0 && index1 < this.nPlanes) {
            var planes = [];
            for (var i = 0; i < this.nPlanes; i++) {
                if (i !== index1) {
                 var altDiff = Math.abs(this.altitudes[index1] - this.altitudes[i]);
                   // log altitude difference
                    if (altDiff <= verticalSeparationMetres) {
                        planes.push(i); // add plane to list
                    }
                }
            }
            return planes; // return list of planes within vertical separation
        } else {
            console.log("Invalid index. Cannot get planes within vertical separation.");
            return null;
        }
    }

    getSeparationIncidents() {
        var incidents = []; // array to hold incidents
        for (var i = 0; i < this.nPlanes; i++) {
            //console.log("Checking plane " + i + " with altitude " + this.altitudes[i]); // log plane altitude
            var planes = this.getPlanesWithinVerticalSeparation(i, this.minimumVerticalSeparation); // get planes within vertical separation of 1000 feet
            //console.log("Planes within vertical separation of " + minVerticalSeparation + " feet: " + planes.length); // log planes within vertical separation
            if (planes.length > 0) { // if there are planes within vertical separation
                for (var j = 0; j < planes.length; j++) {
                    var index2 = planes[j];
                    var verticalSeparation = Math.abs(this.altitudes[i] - this.altitudes[index2]); // calculate vertical separation
                    var horizontalSeparation = this.calculateHorizontalSeparation(i, index2); // calculate horizontal separation
                    if (horizontalSeparation < this.minimumHorizontalSeparation) { // if horizontal separation is less than 3 nautical miles
                        //console.error("Incident detected between planes " + this.flightNumbers[i] + " and " + this.flightNumbers[index2] + " with horizontal separation of " + horizontalSeparation + " nautical miles and vertical separation of " + verticalSeparation + " feet"); // log incident
                        incidents.push({ plane1: i, plane2: index2, horizontalSeparation: horizontalSeparation, verticalSeparation: verticalSeparation }); // add incident to list
                    }
                }
            }
        }
        return incidents; // return list of incidents
    }


}


export { PlaneList, PositionHistory};