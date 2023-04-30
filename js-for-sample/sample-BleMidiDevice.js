/**
 * Sample using BleMidiDevice.
 * @module sample-BleMidiDevice
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright (C) Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

import {bleMidiDevice} from "./sample-BleMidiDevice-instance.js";

//
// Element ID
//

// Button
const selectButton = document.getElementById("selectButton");
const connectButton = document.getElementById("connectButton");
const disconnectButton = document.getElementById("disconnectButton");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const writeButton = document.getElementById("writeButton");
const isConnectedButton = document.getElementById("isConnectedButton");
const getDeviceNameButton = document.getElementById("getDeviceNameButton");

const clearValueChangedLogButton =
      document.getElementById("clearValueChangedLogButton");

// Status span
const selectStatus = document.getElementById("selectStatus");
const connectStatus = document.getElementById("connectStatus");
const disconnectStatus = document.getElementById("disconnectStatus");
const startStatus = document.getElementById("startStatus");
const stopStatus = document.getElementById("stopStatus");
const writeStatus = document.getElementById("writeStatus");
const isConnectedStatus = document.getElementById("isConnectedStatus");
const getDeviceNameStatus = document.getElementById("getDeviceNameStatus");

// Input text
const writeValue = document.getElementById("writeValue");

// Log textarea
const valueChangedLog = document.getElementById("valueChangedLog");

//
// Logging
//

/**
 * Sample handler function to be called when the value is changed.
 * @param {number} timeStamp - Timestamp in millisecond.
 * @param {ArrayBuffer} value - Changed value.
 */
function sampleHandlerValueChanged(timeStamp, value) {
  // Call default handler
  bleMidiDevice.defaultHandlerValueChanged(timeStamp, value);

  // Logging
  valueChangedLog.value = valueChangedLog.value +
    JSON.stringify({"ns": timeStamp * 1000,
                    "data": Array.from(new Uint8Array(value))}) + "\n";
  // Scrolling
  valueChangedLog.scrollTop = valueChangedLog.scrollHeight;
}

// Set the sample handler function.
bleMidiDevice.handlerValueChanged = sampleHandlerValueChanged;

//
// UI function
//

async function select() {
  selectStatus.innerText = "pending...";

  try {
    await bleMidiDevice.select();
  } catch (err) {
    selectStatus.innerText = err;
    return;
  }

  selectStatus.innerText = "Succeeded";
}

async function connect() {
  connectStatus.innerText = "pending...";

  try {
    await bleMidiDevice.connect();
  } catch (err) {
    connectStatus.innerText = err;
    return;
  }

  connectStatus.innerText = "Succeeded";
}

async function disconnect() {
  disconnectStatus.innerText = "pending...";

  try {
    await bleMidiDevice.disconnect();
  } catch (err) {
    disconnectStatus.innerText = err;
    return;
  }

  disconnectStatus.innerText = "Succeeded";
}

async function start() {
  startStatus.innerText = "pending...";

  try {
    await bleMidiDevice.start();
  } catch (err) {
    startStatus.innerText = err;
    return;
  }

  startStatus.innerText = "Succeeded";
}

async function stop() {
  stopStatus.innerText = "pending...";

  try {
    await bleMidiDevice.stop();
  } catch (err) {
    stopStatus.innerText = err;
    return;
  }

  stopStatus.innerText = "Succeeded";
}

async function write() {
  writeStatus.innerText = "pending...";

  const value = new Uint8Array(JSON.parse(writeValue.value)["data"]);
  let a = [];
  for (let i = 0; i < value.byteLength; i++) {
    a.push("0x" + value[i].toString(16).padStart(2, "0"));
  }
  console.log("Write value: " + a.join(" "));

  try {
    await bleMidiDevice.write(value);
  } catch (err) {
    writeStatus.innerText = err;
    return;
  }

  writeStatus.innerText = "Succeeded";
}

function isConnected() {
  let result = bleMidiDevice.isConnected();
  if (result === null) {
    result = "(null)";
  }
  isConnectedStatus.innerText = result;
}

function getDeviceName() {
  let result = bleMidiDevice.getDeviceName();
  if (result === null) {
    result = "(null)";
  }
  getDeviceNameStatus.innerText = result;
}

function clearValueChangedLog() {
  valueChangedLog.value = "";
}

//
// Add event listener.
//

selectButton &&
  selectButton.addEventListener("click", select);
connectButton &&
  connectButton.addEventListener("click", connect);
disconnectButton &&
  disconnectButton.addEventListener("click", disconnect);
startButton &&
  startButton.addEventListener("click", start);
stopButton &&
  stopButton.addEventListener("click", stop);
writeButton &&
  writeButton.addEventListener("click", write);
isConnectedButton &&
  isConnectedButton.addEventListener("click", isConnected);
getDeviceNameButton &&
  getDeviceNameButton.addEventListener("click", getDeviceName);

clearValueChangedLogButton &&
  clearValueChangedLogButton.addEventListener("click", clearValueChangedLog);
