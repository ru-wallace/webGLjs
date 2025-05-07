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

    latLonToXY(lat, lon) {

        
        const x = ((lon - this.minLon) / (this.maxLon - this.minLon)) * this.widthPx;
        const y = this.heightPx - (((lat - this.minLat) / (this.maxLat - this.minLat)) * this.heightPx);


        return { x, y };
    }

    xyToLatLon(x, y) {
        const lon = ((x + 1) / 2) * (this.maxLon - this.minLon) + this.minLon;
        const lat = ((y + 1) / 2) * (this.maxLat - this.minLat) + this.minLat;
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

    generateCircleTriangleIndices(circlePoints) {
        const indices = [];
        const numPoints = ((circlePoints.length ) / 4); // Each point has x and y coordinates
        console.log("numPoints: " + numPoints);
        for (let i = 0; i < numPoints - 1; i++) {
            indices.push(i * 2, i * 2 + 1, (i + 1) * 2); // 0 1 2
            indices.push(i * 2 + 1, (i + 1) * 2 + 1, (i + 1) * 2); // 1 3 2
        }

        // Connect the last point to the first point
        indices.push((numPoints - 1) * 2, (numPoints - 1) * 2 + 1, 0);
        indices.push((numPoints - 1) * 2 + 1, 1, 0);

        return indices;
    }

    generatePlaneTrianglePoints(lat, lon, speed, heading, scale) {
        const center = this.latLonToXY(lat, lon);
        const points = [];

        const angle = (heading-90) * Math.PI / 180; // Rotate by 90 degrees to get the plane's orientation
        const leftPointAngle = angle + Math.PI / 2; // Left point angle
        const rightPointAngle = angle - Math.PI / 2; // Right point angle
        const x1 = center.x + (10*scale) * Math.cos(angle);
        const y1 = center.y + (10*scale) * Math.sin(angle);

        const x2 = center.x + (scale) * Math.cos(leftPointAngle);
        const y2 = center.y + (scale) * Math.sin(leftPointAngle);

        const x3 = center.x + (scale) * Math.cos(rightPointAngle);
        const y3 = center.y + (scale) * Math.sin(rightPointAngle);
        
        points.push(center.x, center.y, x1, y1, x2, y2, x3, y3); // 0 1 2 3

        return points;
    }

    generatePlaneTriangleIndices(planePoints) {
        const indices = [0,1,2,0,3,1];

        
        return indices;
    }


}

export { ATCMap };