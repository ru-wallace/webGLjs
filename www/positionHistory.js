import * as geom from './geometryFunctions.js';

export class PositionHistory {
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
    //   console.log("Adding position if further than min: " + latitude + ", " + longitude);
      const lastPosition = this.getLastPosition();
      if (lastPosition.latitude === null || lastPosition.longitude === null) {
          this.addPosition(latitude, longitude);
        //   console.log("Adding 1st position: " + latitude + ", " + longitude);

          return true;
      } else {
          const dist = geom.calculateDistance(lastPosition.latitude, lastPosition.longitude, latitude, longitude);
          if (dist > distance) {
            //   console.log("Adding position: " + latitude + ", " + longitude);
            //   console.log("Distance: " + dist);
              this.addPosition(latitude, longitude);
              return true;
          }
            // console.log("Not adding position: " + latitude + ", " + longitude + " (distance: " + dist + ")");
      }
      return false;
  }




}