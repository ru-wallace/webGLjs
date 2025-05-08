
export const EARTH_RADIUS_NAUTICAL_MILES = 3440.065; // in nautical miles
export const FEET_TO_NAUTICAL_MILES = 1 / 6076.11549; // conversion factor from feet to nautical miles

const METRES_TO_FEET = 3.28084; // conversion factor from metres to feet

const G_FORCE_TO_METRES_PER_SECOND_SQUARED = 9.80665; // conversion factor from G-force to metres per second squared

const MAX_TURN_RATE = 3; // Degrees per second
const PLANE_MAX_VERTICAL_G_FORCE = 2; // Maximum vertical G-force
const PLANE_MIN_VERTICAL_G_FORCE = 0.75; // Minimum vertical G-force


const VERTICAL_POSITIVE_ACCELERATION_FPS2 = (PLANE_MAX_VERTICAL_G_FORCE - 1) * G_FORCE_TO_METRES_PER_SECOND_SQUARED * METRES_TO_FEET  // Maximum vertical positive acceleration in feet per second squared
const VERTICAL_NEGATIVE_ACCELERATION_FPS2 = (1 - PLANE_MIN_VERTICAL_G_FORCE) * G_FORCE_TO_METRES_PER_SECOND_SQUARED * METRES_TO_FEET // Maximum vertical negative acceleration in feet per second squared

const PLANE_MAX_HORIZONTAL_G_FORCE = 0.3; // Maximum horizontal G-force

const HORIZONTAL_ACCELERATION_FPS2 = (PLANE_MAX_HORIZONTAL_G_FORCE) * G_FORCE_TO_METRES_PER_SECOND_SQUARED * METRES_TO_FEET // Maximum horizontal acceleration in feet per second squared

const MAX_CLIMB_RATE = 2000; // Maximum climb rate in feet per minute
const MAX_DESCENT_RATE = 2000; // Maximum descent rate in feet per minute
class PlaneList {
    altitudes = []; //feet
    targetAltitudes = []; //feet
    latitudes = [];
    longitudes = [];
    speeds = []; //knots
    targetSpeeds = []; //knots
    headings = []; //compass degrees
    targetHeadings = []; //compass degrees
    verticalSpeeds = []; //fpm
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

    constructor(maxPlanes, maxHistory, historyDistance, removeOutOfBounds=false) {
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
        this.historyDistance = historyDistance; // minimum distance to add a new position to the history
        this.removeOutOfBounds = removeOutOfBounds; // remove planes out of bounds
    };

    updatePlane(index, deltaTime) {
        var vSpeedFpS = this.verticalSpeeds[index] / 60; // convert fpm to fps
        var speedNMpS = this.speeds[index] / 3600; // convert knots to nautical miles per second
      
        var northSouthSpeed = speedNMpS * Math.cos(this.headings[index] * Math.PI / 180); //component of speed in the north-south direction
        var eastWestSpeed = speedNMpS * Math.sin(this.headings[index] * Math.PI / 180); // component of speed in the east-west direction

        var latChange = northSouthSpeed * deltaTime / 60; // change in latitude (in degrees). 1 degree = 60 nautical miles
        var altChange = vSpeedFpS * deltaTime; // change in altitude (in feet)
        
        var newAltitude = this.altitudes[index] + altChange; // new altitude in feet

        var middleAltitude = (this.altitudes[index] + newAltitude) / 2; // average altitude in feet
        var middleAltitudeNM = middleAltitude * FEET_TO_NAUTICAL_MILES; // average altitude in nautical miles

        var radius = EARTH_RADIUS_NAUTICAL_MILES + middleAltitudeNM; // radius of the earth at the plane's altitude in nautical miles

        //calculate how much to change longitude based on latitude
        var latInRadians = this.latitudes[index] * Math.PI / 180; // convert to radians
        
        var lonChange = eastWestSpeed * deltaTime / (Math.cos(latInRadians) * radius) * (180 / Math.PI); // change in longitude (in degrees). 1 degree = 60 nautical miles
        this.altitudes[index] = newAltitude; // update altitude
        this.latitudes[index] += latChange; // update latitude
        this.longitudes[index] += lonChange; // update longitude

        this.positionHistories[index].addPositionIfFurtherThanMin(this.latitudes[index], this.longitudes[index], this.historyDistance); // add position to history if further than min distance

        if (this.removeOutOfBounds) {
            var dist = this.calculateDistance(this.latitudes[index], this.longitudes[index], this.boundsCenter.lat, this.boundsCenter.lon); // calculate distance from center of bounds
            if (dist > this.boundsRadius) { // if out of bounds
                console.log("Plane out of bounds: " + this.flightNumbers[index] + " at index " + index);
                console.log("Distance: " + dist + " miles, bounds radius: " + this.boundsRadius + " miles");
                this.removePlane(index); // remove plane from list
                return; // exit function
            }
        }

        // go towards target altitude, speed and heading
        if (this.targetAltitudes[index] !== undefined && this.targetAltitudes[index] !== null) {
            if (this.targetAltitudes[index] > this.altitudes[index]) {
                this.verticalSpeeds[index] = Math.min(this.verticalSpeeds[index] + VERTICAL_POSITIVE_ACCELERATION_FPS2 * deltaTime, MAX_CLIMB_RATE); // increase vertical speed to climb
            } else if (this.targetAltitudes[index] < this.altitudes[index]) {
                this.verticalSpeeds[index] = Math.max(this.verticalSpeeds[index] - VERTICAL_NEGATIVE_ACCELERATION_FPS2 * deltaTime, -MAX_DESCENT_RATE); // decrease vertical speed to descend
            } else {
                this.verticalSpeeds[index] = 0; // stop climbing or descending
            }
        }
        if (this.targetSpeeds[index] !== undefined && this.targetSpeeds[index] !== null) {
            if (this.targetSpeeds[index] > this.speeds[index]) {
                this.speeds[index] = Math.min(this.speeds[index] + HORIZONTAL_ACCELERATION_FPS2 * deltaTime, this.targetSpeeds[index]); // increase speed to target speed
            } else if (this.targetSpeeds[index] < this.speeds[index]) {
                this.speeds[index] = Math.max(this.speeds[index] - HORIZONTAL_ACCELERATION_FPS2 * deltaTime, this.targetSpeeds[index]); // decrease speed to target speed
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

    updateAllPlanes(deltaTime) {
        for (var i = 0; i < this.nPlanes; i++) {
            this.updatePlane(i, deltaTime); // update each plane
        }
    }

    setTargetFlightLevel(index, setTargetFlightLevel) {
        if (index >= 0 && index < this.nPlanes) {
            this.targetAltitudes[index] = setTargetFlightLevel * 100; // set target altitude to current altitude
        } else {
            console.log("Invalid index. Cannot set target flight level.");
        }
    }
    setTargetAltitude(index, targetAltitudeFt) {
        if (index >= 0 && index < this.nPlanes) {
            this.targetAltitudes[index] = targetAltitudeFt; // set target altitude to current altitude
        } else {
            console.log("Invalid index. Cannot set target altitude.");
        }
    }
    setTargetSpeed(index, targetSpeedKts) {
        if (index >= 0 && index < this.nPlanes) {
            this.targetSpeeds[index] = targetSpeedKts; // set target speed to current speed
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

    setBounds(lat, lon, radius) {
        this.boundsCenter.lat = lat;
        this.boundsCenter.lon = lon;
        this.boundsRadius = radius; // in nautical miles

    }

    addPlane(flightNumber, type, squawk, latitude, longitude, altitude, speed, heading, verticalSpeed) {
        if (this.nPlanes < this.maxPlanes) {
            this.flightNumbers[this.nPlanes] = flightNumber;
            this.types[this.nPlanes] = type;
            this.squawks[this.nPlanes] = squawk;
            this.latitudes[this.nPlanes] = latitude;
            this.longitudes[this.nPlanes] = longitude;
            this.altitudes[this.nPlanes] = altitude;
            this.targetAltitudes[this.nPlanes] = altitude; // set target altitude to current altitude
            this.speeds[this.nPlanes] = speed;
            this.targetSpeeds[this.nPlanes] = speed; // set target speed to current speed
            this.headings[this.nPlanes] = heading;
            this.targetHeadings[this.nPlanes] = heading; // set target heading to current heading
            this.verticalSpeeds[this.nPlanes] = verticalSpeed;
            this.nPlanes++;
            this.indexLookup[flightNumber] = this.nPlanes - 1; // add to lookup table
            this.positionHistories[this.nPlanes - 1] = new PositionHistory(this.maxHistory);
            this.positionHistories[this.nPlanes - 1].addPosition(latitude, longitude); // add initial position to history
            console.log("Added plane: " + flightNumber + " at index " + (this.nPlanes - 1));
        } else {
            console.log("Plane list is full. Cannot add more planes.");
        }
    }


    removePlane(index) {
        if (index >= 0 && index < this.nPlanes) {
            delete this.indexLookup[this.flightNumbers[index]]; // remove from lookup table

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
    getPlane(flightNumber) {
        var index = this.getPlaneIndex(flightNumber);
        return this.getPlaneByIndex(index);

    }

    setPlaneParams(params) {
        var index = this.getPlaneIndex(params.flightNumber);
        if (index >= 0 && index < this.nPlanes) {
            if (params.type) this.types[index] = params.type;
            if (params.squawk) this.squawks[index] = params.squawk;
            if (params.latitude) this.latitudes[index] = params.latitude;
            if (params.longitude) this.longitudes[index] = params.longitude;
            if (params.altitude) this.altitudes[index] = params.altitude;
            if (params.speed) this.speeds[index] = params.speed;
            if (params.heading) this.headings[index] = params.heading;
            if (params.verticalSpeed) this.verticalSpeeds[index] = params.verticalSpeed;
        } else {
            console.log("Invalid index. Cannot update plane.");
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3440.065; // Radius of the Earth in nautical miles
        const dLat = this.degreesToRadians(lat2 - lat1);
        const dLon = this.degreesToRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in nautical miles
    }

    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    calculateHorizontalSeparation(index1, index2) {
        if (index1 >= 0 && index1 < this.nPlanes && index2 >= 0 && index2 < this.nPlanes) {
            var lat1 = this.latitudes[index1];
            var lon1 = this.longitudes[index1];
            var lat2 = this.latitudes[index2];
            var lon2 = this.longitudes[index2];
            return this.calculateDistance(lat1, lon1, lat2, lon2); // in nautical miles
        } else {
            console.log("Invalid index. Cannot calculate horizontal separation.");
            return null;
        }
    }

    getPlanesWithinVerticalSeparation(index1, verticalSeparation) {
        if (index1 >= 0 && index1 < this.nPlanes) {
            var planes = [];
            for (var i = 0; i < this.nPlanes; i++) {
                if (i !== index1) {
                 var altDiff = Math.abs(this.altitudes[index1] - this.altitudes[i]);
                   // log altitude difference
                    if (altDiff <= verticalSeparation) {
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

    getSeparationIncidents(minVerticalSeparation, minHorizontalSeparation) {
        var incidents = []; // array to hold incidents
        for (var i = 0; i < this.nPlanes; i++) {
            //console.log("Checking plane " + i + " with altitude " + this.altitudes[i]); // log plane altitude
            var planes = this.getPlanesWithinVerticalSeparation(i, minVerticalSeparation); // get planes within vertical separation of 1000 feet
            //console.log("Planes within vertical separation of " + minVerticalSeparation + " feet: " + planes.length); // log planes within vertical separation
            if (planes.length > 0) { // if there are planes within vertical separation
                for (var j = 0; j < planes.length; j++) {
                    var index2 = planes[j];
                    var verticalSeparation = Math.abs(this.altitudes[i] - this.altitudes[index2]); // calculate vertical separation
                    var horizontalSeparation = this.calculateHorizontalSeparation(i, index2); // calculate horizontal separation
                    if (horizontalSeparation < minHorizontalSeparation) { // if horizontal separation is less than 3 nautical miles
                        console.error("Incident detected between planes " + this.flightNumbers[i] + " and " + this.flightNumbers[index2] + " with horizontal separation of " + horizontalSeparation + " nautical miles and vertical separation of " + verticalSeparation + " feet"); // log incident
                        incidents.push({ plane1: i, plane2: index2, horizontalSeparation: horizontalSeparation, verticalSeparation: verticalSeparation }); // add incident to list
                    }
                }
            }
        }
        return incidents; // return list of incidents
    }


}


class PositionHistory {
    constructor(maxHistory) {
        this.maxHistory = maxHistory;
        this.history = new Array(maxHistory);
        for (let i = 0; i < maxHistory; i++) {
            this.history[i] = { latitude: null, longitude: null };
        }
        this.length = 0;
    }



    addPosition(latitude, longitude) {
        this.history.unshift({ latitude: latitude, longitude: longitude });
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        } 
        this.length = Math.min(this.length + 1, this.maxHistory);
    }

    getPosition(index) {
        return this.history[index];
    }

    getLastPosition() {
        return this.history[0];
    }

    addPositionIfFurtherThanMin(latitude, longitude, distance) {
        const lastPosition = this.getLastPosition();
        if (lastPosition.latitude === null || lastPosition.longitude === null) {
            this.addPosition(latitude, longitude);
            return true;
        } else {
            const dist = this.calculateDistance(lastPosition.latitude, lastPosition.longitude, latitude, longitude);
            if (dist > distance) {
                this.addPosition(latitude, longitude);
                return true;
            }
        }
        return false;
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3440.065; // Radius of the Earth in nautical miles
        const dLat = this.degreesToRadians(lat2 - lat1);
        const dLon = this.degreesToRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in nautical miles
    }



    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }
}
export { PlaneList, PositionHistory};