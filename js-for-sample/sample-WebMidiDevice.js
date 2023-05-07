/**
 * Sample using WebMidiDevice.
 * @module sample-WebMidiDevice
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright (C) Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

import {WebMidiDevice} from "../js/WebMidiDevice.js";

/**
 * WebMidiDevice class instance.
 * @type {module:WebMidiDevice.WebMidiDevice}
 */
const webMidiDevice = new WebMidiDevice();

//
// Element ID
//

// Button
const getMidiPortButton = document.getElementById("getMidiPortButton");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const sendButton = document.getElementById("sendButton");

const clearMidiMessageReceivedLogButton =
      document.getElementById("clearMidiMessageReceivedLogButton");

// Status span
const getMidiPortStatus = document.getElementById("getMidiPortStatus");

// Select Port
const selectMidiInPort = document.getElementById("selectMidiInPort");
const selectMidiOutPort = document.getElementById("selectMidiOutPort");

// Input text
const sendMessage = document.getElementById("sendMessage");

// Log textarea
const midiMessageReceivedLog =
      document.getElementById("midiMessageReceivedLog");

//
// Logging
//

/**
 * Sample handler function to be called when MIDI port state is changed.
 * @param {string} id - MIDI IN/OUT port ID.
 * @param {string} type - MIDI IN/OUT port type.
 * @param {string} state - MIDI IN/OUT port device state.
 * @param {string} connection - MIDI IN/OUT port connection state.
 */
function sampleHandlerMidiStateChanged(id, type, state, connection) {
  // Call default handler
  webMidiDevice.defaultHandlerMidiStateChanged(id, type, state, connection);

  const currentId = webMidiDevice.getCurrentMidiInPortID();
  if (currentId) {
    // MIDI IN port is in use.
    if (id === currentId &&
        (state === "disconnected" || connection === "closed")) {
      stop();
    }
  } else {
    // MIDI IN port is not in use.
    // Reflect MIDI port select
    getMidiPort();
  }
}

// Set the sample handler function.
webMidiDevice.handlerMidiStateChanged = sampleHandlerMidiStateChanged;

/**
 * Sample handler function to be called when a MIDI message is received.
 * @param {number} delta - Delta time in millisecond.
 * @param {Uint8Array} message - Received MIDI message.
 */
function sampleHandlerMidiMessageReceived(delta, message) {
  // Call default handler
  webMidiDevice.defaultHandlerMidiMessageReceived(delta, message);

  // Logging
  midiMessageReceivedLog.value +=
    JSON.stringify({"delta": delta,
                    "message": Array.from(message)}) + "\n";
  // Scrolling
  midiMessageReceivedLog.scrollTop = midiMessageReceivedLog.scrollHeight;
}

// Set the sample handler function.
webMidiDevice.handlerMidiMessageReceived = sampleHandlerMidiMessageReceived;

//
// UI function
//

async function getMidiPort() {
  getMidiPortStatus.innerText = "pending...";

  try {
    await webMidiDevice.buildMidiPortList();
  } catch (err) {
    getMidiPortStatus.innerText = err;
    return;
  }

  const selectedMidiInId = selectMidiInPort.value;
  const selectedMidiOutId = selectMidiOutPort.value;

  while (selectMidiInPort.lastChild) {
    selectMidiInPort.removeChild(selectMidiInPort.lastChild);
  }
  while (selectMidiOutPort.lastChild) {
    selectMidiOutPort.removeChild(selectMidiOutPort.lastChild);
  }

  let bExistBeforeMidiInPort = false;
  for (const id of webMidiDevice.inputIDs) {
    console.log(id + ": " + webMidiDevice.getMidiInPortName(id));

    if (id === selectedMidiInId) {
      bExistBeforeMidiInPort = true;
    }

    const opt = document.createElement("option");
    opt.text = webMidiDevice.getMidiInPortName(id);
    opt.value = id;
    selectMidiInPort.appendChild(opt);
  }
  let bExistBeforeMidiOutPort = false;
  for (const id of webMidiDevice.outputIDs) {
    console.log(id + ": " + webMidiDevice.getMidiOutPortName(id));

    if (id === selectedMidiOutId) {
      bExistBeforeMidiOutPort = true;
    }

    const opt = document.createElement("option");
    opt.text = webMidiDevice.getMidiOutPortName(id);
    opt.value = id;
    selectMidiOutPort.appendChild(opt);
  }

  if (bExistBeforeMidiInPort) {
    selectMidiInPort.value = selectedMidiInId;
  }
  if (bExistBeforeMidiOutPort) {
    selectMidiOutPort.value = selectedMidiOutId;
  }

  getMidiPortStatus.innerText = "Succeeded";
}

function start() {
  console.log("*** Start: " + selectMidiInPort.value + " ***");
  webMidiDevice.start(selectMidiInPort.value);
}

function stop() {
  console.log("*** Stop ***");
  webMidiDevice.stop();
}

function send() {
  const message = new Uint8Array(JSON.parse(sendMessage.value)["message"]);
  let a = [];
  for (let i = 0; i < message.byteLength; i++) {
    a.push("0x" + message[i].toString(16).padStart(2, "0"));
  }
  console.log("*** Send message ***")
  console.log("  " + selectMidiOutPort.value + ": " + a.join(" "));

  webMidiDevice.send(selectMidiOutPort.value, message);
}

function clearMidiMessageReceivedLog() {
  midiMessageReceivedLog.value = "";
}

//
// Add event listener.
//

getMidiPortButton &&
  getMidiPortButton.addEventListener("click", getMidiPort);
startButton &&
  startButton.addEventListener("click", start);
stopButton &&
  stopButton.addEventListener("click", stop);
sendButton &&
  sendButton.addEventListener("click", send);

clearMidiMessageReceivedLogButton &&
  clearMidiMessageReceivedLogButton.addEventListener(
    "click", clearMidiMessageReceivedLog);

//
// Initialize select port
//

getMidiPort();
