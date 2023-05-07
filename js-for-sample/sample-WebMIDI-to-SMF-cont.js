/**
 * Sample Web MIDI to SMF continuance.
 * @module sample-WebMIDI-to-SMF-cont
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright (C) Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

import {WebMidiDevice} from "../js/WebMidiDevice.js";
import {MidiFilter} from "../js/MidiFilter.js";
import {GapDetector} from "../js/GapDetector.js";
import {SmfEncoder} from "../js/SmfEncoder.js";
import {getISOStringTZ} from "./getISOStringTZ.js";

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
 * GapDetector class instance.
 * @type {module:GapDetector.GapDetector}
 */
export const gapDetector = new GapDetector();

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
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");

// Status span
const statusSpan = document.getElementById("statusSpan");

// Select Port
const selectMidiInPort = document.getElementById("selectMidiInPort");

// Input text
const postUrl = document.getElementById("postUrl");

//Result textarea
const postResult = document.getElementById("postResult");

//
// Handler
//

/**
 * Handler function to be called when MIDI port state is changed.
 * @param {string} id - MIDI IN/OUT port ID.
 */
function handlerMidiStateChanged(
  // eslint-disable-next-line no-unused-vars
  id) {
  // Reflect MIDI port select
  getMidiPort();
}

// Set the sample handler function.
webMidiDevice.handlerMidiStateChanged = handlerMidiStateChanged;

/**
 * Handler function to be called a MIDI message is received.
 * @param {number} delta - Delta time in millisecond.
 * @param {Uint8Array} message - MIDI message (reassembled).
 */
function handlerMidiMessageReceived(delta, message) {
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
  // Gap detection
  gapDetector.detect(delta, message);

  // Logging
  console.log(JSON.stringify({"delta": delta,
                              "message": Array.from(message)}));

  // Pass through to SMF encoder
  smfEncoder.encode(delta, message);
}

// Set the handler function.
midiFilter.handlerMidiMessageFiltered =
  handlerMidiMessageFiltered;

/**
 * Handler function to be called when a gap is detected.
 */
function HandlerGapDetected() {
  console.log("*** Gap detected ***");
  _post_smf();
}

// Set the handler function.
gapDetector.handlerGapDetected = HandlerGapDetected;

/**
 * POST divided SMF.
 * @private
 */
async function _post_smf() {
  // Builds an SMF from buffer containing arrived MIDI messages.
  const blob = smfEncoder.build();

  // Clear the buffer.
  // Subsequent incoming messages will be stored in the next SMF.
  smfEncoder.initialize();
  const text = JSON.stringify(
    {"Module": "WebMidiDevice.js",
     "Device": webMidiDevice.getCurrentMidiInPortName(),
     "User-Agent": navigator.userAgent,
     "Language": navigator.language,
     "Location": location.href,
     "Date": getISOStringTZ(recordingDateTime)});
  smfEncoder.meta_text(0, 1, text);

  // Builds a form from the built SMF.
  const formData = new FormData();
  formData.append("foreval", blob, "foreval.mid");

  try {
    const resp = await fetch(postUrl.value, {method: 'POST', body: formData});
    if (resp.status !== 200) {
      postResult.value = resp.status + " " + resp.statusText;
    } else {
      postResult.value = await resp.text();
    }
  } catch (err) {
    postResult.value = err;
  }
}

//
// UI function
//

/** Recording date time */
let recordingDateTime;

async function getMidiPort() {
  statusSpan.innerText = "getting MIDI port...";

  try {
    await webMidiDevice.buildMidiPortList();
  } catch (err) {
    statusSpan.innerText = err;
    return;
  }

  while (selectMidiInPort.lastChild) {
    selectMidiInPort.removeChild(selectMidiInPort.lastChild);
  }

  for (const id of webMidiDevice.inputIDs) {
    console.log(id + ": " + webMidiDevice.getMidiInPortName(id));

    const opt = document.createElement("option");
    opt.text = webMidiDevice.getMidiInPortName(id);
    opt.value = id;
    selectMidiInPort.appendChild(opt);
  }

  startButton.removeAttribute("disabled");
  statusSpan.innerText = "Ready to start recording.";
}

function start() {
  statusSpan.innerText = "starting...";

  midiFilter.initialize();
  smfEncoder.initialize();

  recordingDateTime = new Date();
  const text = JSON.stringify(
    {"Module": "WebMidiDevice.js",
     "Device": webMidiDevice.getCurrentMidiInPortName(),
     "User-Agent": navigator.userAgent,
     "Language": navigator.language,
     "Location": location.href,
     "Date": getISOStringTZ(recordingDateTime)});
  smfEncoder.meta_text(0, 1, text);

  webMidiDevice.start(selectMidiInPort.value);

  selectMidiInPort.setAttribute("disabled", true);
  postUrl.setAttribute("disabled", true);
  stopButton.removeAttribute("disabled");
  statusSpan.innerText = "Recording...";
}

function stop() {
  statusSpan.innerText = "stopping...";

  webMidiDevice.stop();

  stopButton.setAttribute("disabled", true);
  selectMidiInPort.removeAttribute("disabled");
  postUrl.removeAttribute("disabled");
  statusSpan.innerText = "Stopped.";
}

//
// Add event listener
//

getMidiPortButton &&
  getMidiPortButton.addEventListener("click", getMidiPort);
startButton &&
  startButton.addEventListener("click", start);
stopButton &&
  stopButton.addEventListener("click", stop);

//
// Initialize select port
//

getMidiPort();
