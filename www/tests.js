

import * as geom from "./geometryFunctions.js";
import * as convert from "./conversions.js";

class Test {
  constructor(name, fnc, params, expectedValue, testFnc) {
    this.name = name;
    this.fnc = fnc;
    this.params = params;
    this.expectedValue = expectedValue;
    this.error = null;
    this.result = null;
    this.pass = null;
    this.testFnc = testFnc;
  }

  run() {
    try {
      this.result = this.fnc(...this.params);
      this.pass = this.testFnc(this.result);
    } catch (err) {
      this.error = err;
      this.result = null;
    }
  }

  getResult() {
    return {
      name: this.name,
      result: this.result,
      expectedValue: this.expectedValue,
      error: this.error
    }
  }
}

const testList = [];

testList.push(new Test("Knots to M/S^2", convert.ktsToMetresPerSecond, [1,], 0.51444, (result) => {return Math.abs(result - 0.51444) < 0.0001}));
testList.push(new Test("M/S^2 to Knots", convert.metresPerSecondToKts, [1,], 1.9438, (result) => {return Math.abs(result - 1.94384) < 0.0001}));
testList.push(new Test("calculateDestination", geom.calculateDestination, [55, -4.0, 10000, 45], { lat: 55.06355, lon: -3.8889 }, (result) => {
  return Math.abs(result.lat - 55.06355) < 0.0001 && Math.abs(result.lon - -3.8889) < 0.0001;
}));

testList.forEach((test) => {
  var testBox = document.createElement("div");
  testBox.className = "test-box";
  var testName = document.createElement("div");
  testName.className = "test-name";
  testName.innerText = test.name;
  testBox.appendChild(testName);
  var testExpected = document.createElement("div");
  testExpected.className = "test-expected";
  testBox.appendChild(testExpected);
  var testResult = document.createElement("div");
  testResult.className = "test-result";
  testBox.appendChild(testResult);

  test.run();
  testExpected.innerText = "Expected: " + JSON.stringify(test.expectedValue);
  if (test.error) {
    testResult.innerText = "Error: " + test.error;
    testBox.classList.add("error");
  } else {
    testResult.innerText = "Result: " + JSON.stringify(test.result);
    if (!test.pass) {
      testBox.classList.add("fail");
      testBox.classList.remove("pass");
      testResult.innerText += " (fail)";
    } else {
      testBox.classList.add("pass");
      testBox.classList.remove("fail");
      testResult.innerText += " (pass)";
    }

  }

  document.querySelector("#test-list").appendChild(testBox);
});


