/**
 * Sample Web MIDI to SMF.
 * @module sample-WebMIDI-to-SMF
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright (C) Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

import {WebMidiDevice} from "../js/WebMidiDevice.js";
import {MidiFilter} from "../js/MidiFilter.js";
import {SmfEncoder} from "../js/SmfEncoder.js";
import {getISOStringTZ, getISOStringBasicTZ} from "./getISOStringTZ.js";

/**
 * WebMidiDevice class instance.
 * @type {module:WebMidiDevice.WebMidiDevice}
 */
export const webMidiDevice = new WebMidiDevice();

/**
 * MidiFilter class instance.
 * @type {module:MidiFilter.MidiFilter}
 */
export const midiFilter = new MidiFilter();

/**
 * SmfEncoder class instance.
 * @type {module:SmfEncoder.SmfEncoder}
 */
export const smfEncoder = new SmfEncoder();

//
// Element ID
//

// Button
const getMidiPortButton = document.getElementById("getMidiPortButton");
const recordButton = document.getElementById("recordButton");
const stopButton = document.getElementById("stopButton");
const downloadButton = document.getElementById("downloadButton");

const clearReceivedLogButton =
      document.getElementById("clearReceivedLogButton");
const clearFilteredLogButton =
      document.getElementById("clearFilteredLogButton");

// Status span
const statusSpan = document.getElementById("statusSpan");

// Select Port
const selectMidiInPort = document.getElementById("selectMidiInPort");

// Log textarea
const receivedLog = document.getElementById("receivedLog");
const filteredLog = document.getElementById("filteredLog");

//
// Handler
//

/**
 * Handler function to be called when MIDI port state is changed.
 * @param {string} id - MIDI IN/OUT port ID.
 * @param {string} type - MIDI IN/OUT port type.
 * @param {string} state - MIDI IN/OUT port state.
 * @param {string} connection - MIDI IN/OUT port connection.
 */
function handlerMidiStateChanged(id,
                                 // eslint-disable-next-line no-unused-vars
                                 type,
                                 state,
                                 connection) {
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
webMidiDevice.handlerMidiStateChanged = handlerMidiStateChanged;

/**
 * Handler function to be called when a MIDI message is received.
 * @param {number} delta - Delta time in millisecond.
 * @param {Uint8Array} message - Received MIDI message.
 */
function handlerMidiMessageReceived(delta, message) {
  // Logging
  logMidiMessage(delta, message, receivedLog);
  // Pass through to MIDI filter
  midiFilter.filter(delta, message);
}

// Set the handler function.
webMidiDevice.handlerMidiMessageReceived =
  handlerMidiMessageReceived;

/**
 * Handler function to be called
 *     when a MIDI message is filtered.
 * @param {number} delta - Delta time in millisecond.
 * @param {Uint8Array} message - MIDI message (filtered).
 */
function handlerMidiMessageFiltered(delta, message) {
  // Logging
  logMidiMessage(delta, message, filteredLog);
  // Pass through to SMF encoder
  smfEncoder.encode(delta, message);
}

// Set the handler function.
midiFilter.handlerMidiMessageFiltered =
  handlerMidiMessageFiltered;

//
// Logging
//

/**
 * Logging MIDI message.
 * @param {number} delta - Delta time in millisecond.
 * @param {Uint8Array} message - MIDI message (reassembled).
 * @param {?HTMLTextAreaElement} json - JSON log element.
 */
function logMidiMessage(delta, message, json) {
  if (json) {
    json.value +=
      JSON.stringify({"delta": delta, "message": Array.from(message)}) + "\n";
    json.scrollTop = json.scrollHeight;
  }
}

//
// UI function
//

/** Recording date time */
let recordingDateTime;

async function getMidiPort() {
  recordButton.setAttribute("disabled", true);
  stopButton.setAttribute("disabled", true);
  downloadButton.setAttribute("disabled", true);

  statusSpan.innerText = "getting MIDI port...";

  try {
    await webMidiDevice.buildMidiPortList();
  } catch (err) {
    statusSpan.innerText = err;
    return;
  }

  const selectedMidiInId = selectMidiInPort.value;

  while (selectMidiInPort.lastChild) {
    selectMidiInPort.removeChild(selectMidiInPort.lastChild);
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

  if (bExistBeforeMidiInPort) {
    selectMidiInPort.value = selectedMidiInId;
  }

  recordButton.removeAttribute("disabled");
  statusSpan.innerText = "Ready to start recording.";
}

function start() {
  statusSpan.innerText = "starting...";
  recordButton.setAttribute("disabled", true);
  stopButton.setAttribute("disabled", true);
  downloadButton.setAttribute("disabled", true);

  midiFilter.initialize();
  smfEncoder.initialize();

  recordingDateTime = new Date();
  const text = JSON.stringify(
    {"Module": "WebMidiDevice.js",
     "Device": webMidiDevice.getMidiInPortName(selectMidiInPort.value),
     "User-Agent": navigator.userAgent,
     "Language": navigator.language,
     "Location": location.href,
     "Date": getISOStringTZ(recordingDateTime)});
  smfEncoder.meta_text(0, 1, text);

  webMidiDevice.start(selectMidiInPort.value);

  stopButton.removeAttribute("disabled");
  statusSpan.innerText = "Recording...";
}

function stop() {
  statusSpan.innerText = "stopping...";
  recordButton.setAttribute("disabled", true);
  stopButton.setAttribute("disabled", true);
  downloadButton.setAttribute("disabled", true);

  webMidiDevice.stop();

  recordButton.removeAttribute("disabled");
  downloadButton.removeAttribute("disabled");
  statusSpan.innerText = "Ready to download.";
}

function download() {
  const link = document.createElement("a");
  link.download = "data-" + getISOStringBasicTZ(recordingDateTime) + ".mid";
  link.href = URL.createObjectURL(smfEncoder.build());
  link.click();
  URL.revokeObjectURL(link.href);
}

function clearReceivedLog() {
  receivedLog && (receivedLog.value = "");
}

function clearFilteredLog() {
  filteredLog && (filteredLog.value = "");
}

//
// Add event listener
//

getMidiPortButton &&
  getMidiPortButton.addEventListener("click", getMidiPort);
recordButton &&
  recordButton.addEventListener("click", start);
stopButton &&
  stopButton.addEventListener("click", stop);
downloadButton &&
  downloadButton.addEventListener("click", download);
clearReceivedLogButton &&
  clearReceivedLogButton.addEventListener("click", clearReceivedLog);
clearFilteredLogButton &&
  clearFilteredLogButton.addEventListener("click", clearFilteredLog);

//
// Initialize select port
//

getMidiPort();
