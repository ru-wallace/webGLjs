class ATCMap {
    minLat = 0;
    maxLat = 0;
    minLon = 0;
    maxLon = 0;

    widthPx = 0;
    heightPx = 0;

    constructor(minLat, maxLat, minLon, maxLon, widthPx, heightPx) {
        this.minLat = minLat;
        this.maxLat = maxLat;
        this.minLon = minLon;
        this.maxLon = maxLon;
        this.widthPx = widthPx;
        this.heightPx = heightPx;
    }

    distanceNMToPixels(distanceNM) {
        const latRange = this.maxLat - this.minLat;
        const lonRange = this.maxLon - this.minLon;
        const latDistancePx = (distanceNM / 60) * (this.heightPx / latRange);
        return latDistancePx;
    }

    latLonToXY(lat, lon) {

        
        const x = ((lon - this.minLon) / (this.maxLon - this.minLon)) * this.widthPx;
        const y = this.heightPx - (((lat - this.minLat) / (this.maxLat - this.minLat)) * this.heightPx);


        return { x, y };
    }

    xyToLatLon(x, y) {
        const lon = ((x / this.widthPx) * (this.maxLon - this.minLon)) + this.minLon;
        const lat = ((this.heightPx - y) / this.heightPx) * (this.maxLat - this.minLat) + this.minLat;
        return { lat, lon };
    }

    generateCirclePoints(lat, lon, radiusPx, numPoints, lineThicknessPx) {
        if (radiusPx <= 0) {
            throw new Error("radiusPx must be greater than 0");
        }
        if (numPoints < 3) {
            throw new Error("numPoints must be at least 3");
        }
        const center = this.latLonToXY(lat, lon);
        const points = [];

        const innerRadiusPx = radiusPx - lineThicknessPx / 2;
        const outerRadiusPx = radiusPx + lineThicknessPx / 2;

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;

            const outerX = center.x + (outerRadiusPx) * Math.cos(angle);
            const outerY = center.y + (outerRadiusPx) * Math.sin(angle);

            const innerX = center.x + (innerRadiusPx) * Math.cos(angle);
            const innerY = center.y + (innerRadiusPx) * Math.sin(angle);


            
            points.push(outerX, outerY, innerX, innerY);
        }

        return points;
    }

    generateCentreCirclePoints(radiusPx, numPoints, lineThicknessPx) {
        if (radiusPx <= 0) {
            throw new Error("radiusPx must be greater than 0");
        }
        if (numPoints < 3) {
            throw new Error("numPoints must be at least 3");
        }
        const center = { x: this.widthPx / 2, y: this.heightPx / 2 };
        const points = [];

        const innerRadiusPx = radiusPx - lineThicknessPx / 2;
        const outerRadiusPx = radiusPx + lineThicknessPx / 2;

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;

            const outerX = center.x + (outerRadiusPx) * Math.cos(angle);
            const outerY = center.y + (outerRadiusPx) * Math.sin(angle);

            const innerX = center.x + (innerRadiusPx) * Math.cos(angle);
            const innerY = center.y + (innerRadiusPx) * Math.sin(angle);


            
            points.push(outerX, outerY, innerX, innerY);
        }

        return points;
    }



    generateCircleIndices(circlePoints, startIndex=0) {
        var indices = [];
        const numPoints = ((circlePoints.length ) / 4); // Each point has x and y coordinates
        console.log("numPoints: " + numPoints);
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

    generateFilledCircle(radiusPx, numPoints, startIndex=0) {
        if (radiusPx <= 0) {
            throw new Error("radiusPx must be greater than 0");
        }
        if (numPoints < 3) {
            throw new Error("numPoints must be at least 3");
        }
        const center = { x: this.widthPx / 2, y: this.heightPx / 2 };

        const points = [center.x, center.y]; // Start with the center point
        var indices = [];
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;

            const x = center.x + radiusPx * Math.cos(angle);
            const y = center.y + radiusPx * Math.sin(angle);

            points.push(x, y); // Center point and outer point

            if (i > 1) {
                indices.push(0, i , i-1); // 0 2 1, 0 3 2, 0 4 3, etc.
            }


        }

        // Connect the last point to the first point
        indices.push(0, 1, numPoints-1);

        indices = indices.map(index => index + startIndex); // Adjust indices to start from 0
        return { points, indices }; // Adjust indices to start from 0
    }



    generatePlaneTrianglePoints(lat, lon, speed, heading, scale) {
        const center = this.latLonToXY(lat, lon);
        const points = [];

        const angle = (heading+90) * Math.PI / 180; // Rotate by 90 degrees to get the plane's orientation

        const leftPointAngle = angle + 2* Math.PI / 3; // Left point angle
        const rightPointAngle = angle - 2 * Math.PI / 3; // Right point angle

        console.log("angle: " + angle * 180 / Math.PI);
        console.log("leftPointAngle: " + leftPointAngle * 180 / Math.PI);
        console.log("rightPointAngle: " + rightPointAngle * 180 / Math.PI);
        console.log("center: " + center.x + ", " + center.y);

        const x1 = center.x + (scale) * Math.sin(angle);
        const y1 = center.y + (scale) * Math.cos(angle);

        const x2 = center.x + (scale*(2/3)) * Math.sin(leftPointAngle);
        const y2 = center.y + (scale*(2/3)) * Math.cos(leftPointAngle);

        const x3 = center.x + (scale*(2/3)) * Math.cos(rightPointAngle);
        const y3 = center.y + (scale*(2/3)) * Math.sin(rightPointAngle);
        
        console.log("x1: " + x1 + ", y1: " + y1);
        console.log("x2: " + x2 + ", y2: " + y2);
        console.log("x3: " + x3 + ", y3: " + y3);
        points.push(center.x, center.y, x1, y1, x2, y2, x3, y3); // 0 1 2 3

        return points;
    }

    generateCentreTrianglePoints(scale, pointerLength) {
        const center = { x: this.widthPx / 2, y: this.heightPx / 2 };
        const points = [];

        const angle = 0; // Rotate by 90 degrees to get the plane's orientation

        const leftPointAngle = 2* Math.PI / 3; // Left point angle
        const rightPointAngle = 2* Math.PI / 3; // Right point angle


        const frontX = center.x;
        const frontY = center.y - (scale*0.5);

        const backX = center.x;
        const backY = center.y + (scale*0.3);

        let backScale = scale * 2 / 3;

        const backPointsY = backY + (backScale) * Math.sin(leftPointAngle)*0.5;
        const leftX = backX - (backScale) * Math.cos(rightPointAngle);
        const rightX = backX + (backScale) * Math.cos(rightPointAngle);

        points.push(center.x, backY, center.x, frontY, leftX, backPointsY, rightX, backPointsY); // 0 1 2 3

 
        return points;
    }

    generatePlaneTriangleIndices(startIndex=0) {
        const indices = [0, 1, 2, 0, 3, 1]; //0,3,1

 return indices.map(index => index + startIndex);
    }

    generatePlanePointer(scale, startIndex=0) {
        const center = { x: this.widthPx / 2, y: this.heightPx / 2 };
        const points = [];
            //make pointer points
            const pointerWidth = 2;
            const pointerx1 = center.x - (0.5 * pointerWidth);
            const pointerx2 = center.x + (0.5 * pointerWidth);
    
            const pointery1 = center.y - (scale);
    
            points.push(pointerx1, center.y, pointerx2, center.y, pointerx1, pointery1, pointerx2, pointery1); // 0 1 2 3

            const initialIndices = [0, 1, 2, 1, 3, 2]; //0,3,1
            const indices = initialIndices.map(index => index + startIndex); // Adjust indices to start from 0
            return { points, indices }; // Adjust indices to start from 0

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

    calculatePoint(lat1, lon1, bearing, distanceNM) {
        const R = 3440.065; // Radius of the Earth in nautical miles
        const lat1Rad = this.degreesToRadians(lat1);
        const lon1Rad = this.degreesToRadians(lon1);
        const bearingRad = this.degreesToRadians(bearing);

        const lat2Rad = Math.asin(Math.sin(lat1Rad) * Math.cos(distanceNM / R) +
            Math.cos(lat1Rad) * Math.sin(distanceNM / R) * Math.cos(bearingRad));
        const lon2Rad = lon1Rad + Math.atan2(Math.sin(bearingRad) * Math.sin(distanceNM / R) * Math.cos(lat1Rad),
            Math.cos(distanceNM / R) - Math.sin(lat1Rad) * Math.sin(lat2Rad));

        return { lat: this.radiansToDegrees(lat2Rad), lon: this.radiansToDegrees(lon2Rad) };
    }
    

    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }


}

export { ATCMap };