/**
 * Sample BLE-MIDI to SMF.
 * @module sample-BLE-MIDI-to-SMF
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright (C) Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

import {BleMidiDevice} from "../js/BleMidiDevice.js";
import {MidiFilter} from "../js/MidiFilter.js";
import {SmfEncoder} from "../js/SmfEncoder.js";
import {getISOStringTZ, getISOStringBasicTZ} from "./getISOStringTZ.js";

/**
 * BleMidiDevice class instance.
 * @type {module:BleMidiDevice.BleMidiDevice}
 */
export const bleMidiDevice = new BleMidiDevice();

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
const selectConnectButton = document.getElementById("selectConnectButton");
const recordButton = document.getElementById("recordButton");
const stopButton = document.getElementById("stopButton");
const downloadButton = document.getElementById("downloadButton");

const clearValueChangedLogButton =
      document.getElementById("clearValueChangedLogButton");
const clearDecodedLogButton =
      document.getElementById("clearDecodedLogButton");
const clearReassembledLogButton =
      document.getElementById("clearReassembledLogButton");
const clearFilteredLogButton =
      document.getElementById("clearFilteredLogButton");

// Status span
const statusSpan = document.getElementById("statusSpan");

// Log textarea
const valueChangedLog = document.getElementById("valueChangedLog");
const decodedLog = document.getElementById("decodedLog");
const reassembledLog = document.getElementById("reassembledLog");
const filteredLog = document.getElementById("filteredLog");

//
// Handler
//

/**
 * Handler function to be called when the value is changed.
 * @param {number} timeStamp - Timestamp in millisecond.
 * @param {ArrayBuffer} value - Changed value.
 */
function handlerValueChanged(timeStamp, value) {
  // Logging
  logValueChanged(timeStamp, value);
  // Pass through to MIDI decoder
  bleMidiDevice.bleMidiPacket.decode(timeStamp, value);
}

// Set the sample handler function.
bleMidiDevice.handlerValueChanged = handlerValueChanged;

/**
 * Handler function to be called
 *     when a MIDI message (fragmented) is decoded.
 * @param {number} delta - Delta time in millisecond.
 * @param {Uint8Array} message - MIDI message (fragmented).
 */
function handlerMidiMessageDecoded(delta, message) {
  // Logging
  logMidiMessage(delta, message, decodedLog);
  // Pass through to MIDI reassembler
  bleMidiDevice.bleMidiPacket.reassemble(delta, message);
}

// Set the sample handler function.
bleMidiDevice.bleMidiPacket.handlerMidiMessageDecoded =
  handlerMidiMessageDecoded;

/**
 * Handler function to be called
 *     when fragmented MIDI messages are reassembled.
 * @param {number} delta - Delta time in millisecond.
 * @param {Uint8Array} message - MIDI message (reassembled).
 */
function handlerMidiMessageReassembled(delta, message) {
  // Logging
  logMidiMessage(delta, message, reassembledLog);
  // Pass through to MIDI filter
  midiFilter.filter(delta, message);
}

// Set the handler function.
bleMidiDevice.bleMidiPacket.handlerMidiMessageReassembled =
  handlerMidiMessageReassembled;

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
 * Logging value changed.
 * @param {number} timeStamp - Timestamp in millisecond.
 * @param {ArrayBuffer} value - Changed value.
 */
function logValueChanged(timeStamp, value) {
  if (valueChangedLog) {
    valueChangedLog.value +=
      JSON.stringify({"ns": timeStamp * 1000,
                      "data": Array.from(new Uint8Array(value))}) + "\n";
    valueChangedLog.scrollTop = valueChangedLog.scrollHeight;
  }
}

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

async function selectConnect() {
  recordButton.setAttribute("disabled", true);
  stopButton.setAttribute("disabled", true);
  downloadButton.setAttribute("disabled", true);

  if (bleMidiDevice.isConnected()) {
    statusSpan.innerText = "disconnecting...";
    try {
      await bleMidiDevice.disconnect();
    } catch (err) {
      statusSpan.innerText = err;
      return;
    }
  }

  statusSpan.innerText = "initializing...";

  bleMidiDevice.bleMidiPacket.initializeDecoder();
  bleMidiDevice.bleMidiPacket.initializeReassembler();
  midiFilter.initialize();
  smfEncoder.initialize();

  statusSpan.innerText = "selecting...";

  try {
    await bleMidiDevice.select();
  } catch (err) {
    statusSpan.innerText = err;
    return;
  }

  statusSpan.innerText = "connecting...";

  try {
    await bleMidiDevice.connect();
  } catch (err) {
    statusSpan.innerText = err;
    return;
  }

  recordButton.removeAttribute("disabled");
  statusSpan.innerText = "Ready to start recording.";
}

async function start() {
  statusSpan.innerText = "starting...";
  recordButton.setAttribute("disabled", true);
  stopButton.setAttribute("disabled", true);
  downloadButton.setAttribute("disabled", true);

  bleMidiDevice.bleMidiPacket.initializeDecoder();
  bleMidiDevice.bleMidiPacket.initializeReassembler();
  midiFilter.initialize();
  smfEncoder.initialize();

  recordingDateTime = new Date();
  const text = JSON.stringify({"Module": "BleMidiDevice.js",
                               "Device": bleMidiDevice.getDeviceName(),
                               "User-Agent": navigator.userAgent,
                               "Language": navigator.language,
                               "Location": location.href,
                               "Date": getISOStringTZ(recordingDateTime)});
  smfEncoder.meta_text(0, 1, text);

  try {
    await bleMidiDevice.start();
  } catch (err) {
    statusSpan.innerText = err;
    return;
  }

  stopButton.removeAttribute("disabled");
  statusSpan.innerText = "Recording...";
}

async function stop() {
  statusSpan.innerText = "stopping...";
  recordButton.setAttribute("disabled", true);
  stopButton.setAttribute("disabled", true);
  downloadButton.setAttribute("disabled", true);

  try {
    await bleMidiDevice.stop();
  } catch (err) {
    statusSpan.innerText = err;
    return;
  }

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

function clearValueChangedLog() {
  valueChangedLog && (valueChangedLog.value = "");
}

function clearDecodedLog() {
  decodedLog && (decodedLog.value = "");
}

function clearReassembledLog() {
  reassembledLog && (reassembledLog.value = "");
}

function clearFilteredLog() {
  filteredLog && (filteredLog.value = "");
}

//
// Add event listener
//

selectConnectButton &&
  selectConnectButton.addEventListener("click", selectConnect);
recordButton &&
  recordButton.addEventListener("click", start);
stopButton &&
  stopButton.addEventListener("click", stop);
downloadButton &&
  downloadButton.addEventListener("click", download);
clearValueChangedLogButton &&
  clearValueChangedLogButton.addEventListener("click", clearValueChangedLog);
clearDecodedLogButton &&
  clearDecodedLogButton.addEventListener("click", clearDecodedLog);
clearReassembledLogButton &&
  clearReassembledLogButton.addEventListener("click", clearReassembledLog);
clearFilteredLogButton &&
  clearFilteredLogButton.addEventListener("click", clearFilteredLog);
