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
        console.log("widthPx: " + this.widthPx);
        console.log("heightPx: " + this.heightPx);
        console.log("minLat: " + this.minLat);
        console.log("maxLat: " + this.maxLat);
        console.log("minLon: " + this.minLon);
        console.log("maxLon: " + this.maxLon);
        
        const x = ((lon - this.minLon) / (this.maxLon - this.minLon)) * this.widthPx;
        const y = this.heightPx - (((lat - this.minLat) / (this.maxLat - this.minLat)) * this.heightPx);

        console.log("lat: " + lat + "-> y: " + y);
        console.log("lon: " + lon + "-> x: " + x);
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


}

export { ATCMap };