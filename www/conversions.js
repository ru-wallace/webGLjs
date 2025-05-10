const METRES_TO_FEET = 3.28084; // conversion factor from metres to feet
const METRES_TO_NAUTICAL_MILES = 0.000539957; // conversion factor from metres to nautical miles
const G_FORCE_TO_METRES_PER_SECOND_SQUARED = 9.80665; // conversion factor from G-force to metres per second squared


const METRES_PER_SECOND_TO_KNOTS = 3600 * METRES_TO_NAUTICAL_MILES; // conversion factor from metres per second to knots


export function ktsToMetresPerSecond(kts) {
  return kts / METRES_PER_SECOND_TO_KNOTS;
}

export function metresPerSecondToKts(mps) {
  return mps * METRES_PER_SECOND_TO_KNOTS;
}

export function verticalAccelerationToGForce(mps, applyGravity = true) {
  let gravityCorrection = applyGravity ? 1 : 0;
  return (mps / G_FORCE_TO_METRES_PER_SECOND_SQUARED) + gravityCorrection;
}

export function gForceToVerticalAcceleration(gForce, applyGravity = true) {
  let gravityCorrection = applyGravity ? 1 : 0;
  return (gForce - gravityCorrection) * G_FORCE_TO_METRES_PER_SECOND_SQUARED;
}

export function metresToFeet(metres) {
  return metres * METRES_TO_FEET;
}
export function feetToMetres(feet) {
  return feet / METRES_TO_FEET;
}

export function feetPerMinuteToMetresPerSecond(fpm) {
  return feetToMetres(fpm / 60);
}

export function metresPerSecondToFeetPerMinute(mps) {
  return metresToFeet(mps * 60);
}

export function metresToNauticalMiles(metres) {
  return metres * METRES_TO_NAUTICAL_MILES;
}
export function nauticalMilesToMetres(nauticalMiles) {
  return nauticalMiles / METRES_TO_NAUTICAL_MILES;
}
export function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}
export function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}
