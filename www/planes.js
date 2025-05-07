
export const EARTH_RADIUS_NAUTICAL_MILES = 3440.065; // in nautical miles
export const FEET_TO_NAUTICAL_MILES = 1 / 6076.11549; // conversion factor from feet to nautical miles

class PlaneList {
    altitudes = []; //feet
    latitudes = [];
    longitudes = [];
    speeds = []; //knots
    headings = []; //compass degrees
    verticalSpeeds = []; //fpm
    flightNumbers = [];
    types = [];
    squawks = [];
    indexLookup = {}; // lookup table for flight numbers to indices
    nPlanes = 0; // number of planes in the list
    maxPlanes = 0; // maximum number of planes in the list

    constructor(maxPlanes) {
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
        
    };

    updateLocation(index, deltaTime) {
        console.log("Updating location for plane at index: " + index);
        console.log("Vertical speed: " + this.verticalSpeeds[index] + ", speed: " + this.speeds[index] + ", heading: " + this.headings[index]);
        var vSpeedFpS = this.verticalSpeeds[index] / 60; // convert fpm to fps
        var speedNMpS = this.speeds[index] / 3600; // convert knots to nautical miles per second
        console.log("vSpeedFpS: " + vSpeedFpS + ", speedNMpS: " + speedNMpS);
        var northSouthSpeed = speedNMpS * Math.cos(this.headings[index] * Math.PI / 180); //component of speed in the north-south direction
        var eastWestSpeed = speedNMpS * Math.sin(this.headings[index] * Math.PI / 180); // component of speed in the east-west direction

        console.log("northSouthSpeed: " + northSouthSpeed + ", eastWestSpeed: " + eastWestSpeed);
        var latChange = northSouthSpeed * deltaTime / 60; // change in latitude (in degrees). 1 degree = 60 nautical miles
        var altChange = vSpeedFpS * deltaTime; // change in altitude (in feet)
        
        var newAltitude = this.altitudes[index] + altChange; // new altitude in feet

        var middleAltitude = (this.altitudes[index] + newAltitude) / 2; // average altitude in feet
        var middleAltitudeNM = middleAltitude * FEET_TO_NAUTICAL_MILES; // average altitude in nautical miles

        var radius = EARTH_RADIUS_NAUTICAL_MILES + middleAltitudeNM; // radius of the earth at the plane's altitude in nautical miles
        console.log("radius: " + radius + ", middleAltitudeNM: " + middleAltitudeNM);
        //calculate how much to change longitude based on latitude
        var latInRadians = this.latitudes[index] * Math.PI / 180; // convert to radians
        
        var lonChange = eastWestSpeed * deltaTime / (Math.cos(latInRadians) * radius) * (180 / Math.PI); // change in longitude (in degrees). 1 degree = 60 nautical miles
        console.log("latChange: " + latChange + ", lonChange: " + lonChange + ", newAltitude: " + newAltitude);
        this.altitudes[index] = newAltitude; // update altitude
        this.latitudes[index] += latChange; // update latitude
        this.longitudes[index] += lonChange; // update longitude
    }

    addPlane(flightNumber, type, squawk, latitude, longitude, altitude, speed, heading, verticalSpeed) {
        if (this.nPlanes < this.maxPlanes) {
            this.flightNumbers[this.nPlanes] = flightNumber;
            this.types[this.nPlanes] = type;
            this.squawks[this.nPlanes] = squawk;
            this.latitudes[this.nPlanes] = latitude;
            this.longitudes[this.nPlanes] = longitude;
            this.altitudes[this.nPlanes] = altitude;
            this.speeds[this.nPlanes] = speed;
            this.headings[this.nPlanes] = heading;
            this.verticalSpeeds[this.nPlanes] = verticalSpeed;
            this.nPlanes++;
            this.indexLookup[flightNumber] = this.nPlanes - 1; // add to lookup table
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
            this.types[index] = this.types[this.nPlanes - 1];
            this.squawks[index] = this.squawks[this.nPlanes - 1];
            this.latitudes[index] = this.latitudes[this.nPlanes - 1];
            this.longitudes[index] = this.longitudes[this.nPlanes - 1];
            this.altitudes[index] = this.altitudes[this.nPlanes - 1];
            this.speeds[index] = this.speeds[this.nPlanes - 1];
            this.headings[index] = this.headings[this.nPlanes - 1];
            this.verticalSpeeds[index] = this.verticalSpeeds[this.nPlanes - 1];
            this.indexLookup[this.flightNumbers[index]] = index; // update lookup table

            this.flightNumbers[this.nPlanes - 1] = null;
            this.types[this.nPlanes - 1] = null;
            this.squawks[this.nPlanes - 1] = null;
            this.latitudes[this.nPlanes - 1] = null;
            this.longitudes[this.nPlanes - 1] = null;
            this.altitudes[this.nPlanes - 1] = null;
            this.speeds[this.nPlanes - 1] = null;
            this.headings[this.nPlanes - 1] = null;
            this.verticalSpeeds[this.nPlanes - 1] = null;


            this.nPlanes--;
        } else {
            console.log("Invalid index. Cannot remove plane.");
        }
    }

    getPlaneIndex(flightNumber) {
        return this.indexLookup[flightNumber]; // returns -1 if not found
    }
    getPlane(flightNumber) {
        var index = this.getPlaneIndex(flightNumber);
        if (index >= 0 && index < this.nPlanes) {
            return {
                flightNumber: this.flightNumbers[index],
                type: this.types[index],
                squawk: this.squawks[index],
                latitude: this.latitudes[index],
                longitude: this.longitudes[index],
                altitude: this.altitudes[index],
                speed: this.speeds[index],
                heading: this.headings[index],
                verticalSpeed: this.verticalSpeeds[index],
            };
        } else {
            return null;
        }
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
                speed: this.speeds[index],
                heading: this.headings[index],
                verticalSpeed: this.verticalSpeeds[index],
            };
        } else {
            return null;
        }
    }

    updatePlane(params) {
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
}

export { PlaneList };