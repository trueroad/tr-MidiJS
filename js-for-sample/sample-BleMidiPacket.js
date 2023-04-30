/**
 * Sample using BleMidiPacket.
 * @module sample-BleMidiPacket
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
const initializeDecoderButton =
      document.getElementById("initializeDecoderButton");
const decodeButton =
      document.getElementById("decodeButton");
const clearDecodedLogButton =
      document.getElementById("clearDecodedLogButton");
const initializeReassemblerButton =
      document.getElementById("initializeReassemblerButton");
const reassembleButton =
      document.getElementById("reassembleButton");
const clearReassembledLogButton =
      document.getElementById("clearReassembledLogButton");

// Input text
const toDecode = document.getElementById("toDecode");
const toReassemble = document.getElementById("toReassemble");

// Log textarea
const decodedLog = document.getElementById("decodedLog");
const decodedHexLog = document.getElementById("decodedHexLog");
const reassembledLog = document.getElementById("reassembledLog");
const reassembledHexLog = document.getElementById("reassembledHexLog");

//
// Logging
//

/**
 * Sample handler function to be called
 *     when a MIDI message (fragmented) is decoded.
 * @param {number} delta - Delta time in millisecond.
 * @param {Uint8Array} message - MIDI message (fragmented).
 */
function sampleHandlerMidiMessageDecoded(delta, message) {
  // Call default handler
  bleMidiDevice.bleMidiPacket.defaultHandlerMidiMessageDecoded(delta, message);

  // Logging
  logMidiMessage(delta, message, decodedLog, decodedHexLog);
}

// Set the sample handler function.
bleMidiDevice.bleMidiPacket.handlerMidiMessageDecoded =
  sampleHandlerMidiMessageDecoded;

/**
 * Sample handler function to be called
 *     when fragmented MIDI messages are reassembled.
 * @param {number} delta - Delta time in millisecond.
 * @param {Uint8Array} message - MIDI message (reassembled).
 */
function sampleHandlerMidiMessageReassembled(delta, message) {
  // Call default handler
  bleMidiDevice.bleMidiPacket.defaultHandlerMidiMessageReassembled(
    delta, message);

  // Logging
  logMidiMessage(delta, message, reassembledLog, reassembledHexLog);
}

// Set the sample handler function.
bleMidiDevice.bleMidiPacket.handlerMidiMessageReassembled =
  sampleHandlerMidiMessageReassembled;

/**
 * Logging MIDI message.
 * @param {number} delta - Delta time in millisecond.
 * @param {Uint8Array} message - MIDI message (reassembled).
 * @param {?HTMLTextAreaElement} json - JSON log element.
 * @param {?HTMLTextAreaElement} hex - Hex text log element.
 */
function logMidiMessage(delta, message, json, hex) {
  if (json) {
    json.value +=
      JSON.stringify({"delta": delta, "message": Array.from(message)}) + "\n";
    json.scrollTop = json.scrollHeight;
  }

  if (hex) {
    let a = [];
    for (let i = 0; i < message.byteLength; i++) {
      a.push(message[i].toString(16).padStart(2, "0"));
    }
    hex.value +=
      "Delta time  : " + delta + " ms\n" +
      "MIDI message: " + a.join(" ") + "\n";
    hex.scrollTop = hex.scrollHeight;
  }
}

//
// UI function
//

function initializeDecoder() {
  bleMidiDevice.bleMidiPacket.initializeDecoder();
}

function decode() {
  toDecode.value.split("\n").
    filter(line => !/^\s*$/.test(line)).map(JSON.parse).
    map(json => {
      const t = json["t"] === undefined
            ? (json["ns"] / 1000)
            : json["t"];
      const v = new Uint8Array(json["data"]);
      bleMidiDevice.bleMidiPacket.decode(t, v.buffer);
    });
}

function clearDecodedLog() {
  decodedLog && (decodedLog.value = "");
  decodedHexLog && (decodedHexLog.value = "");
}

function initializeReassembler() {
  bleMidiDevice.bleMidiPacket.initializeReassembler();
}

function reassemble() {
  toReassemble.value.split("\n").
    filter(line => !/^\s*$/.test(line)).map(JSON.parse).
    map(json => {
      const t = json["delta"];
      const m = new Uint8Array(json["message"]);
      bleMidiDevice.bleMidiPacket.reassemble(t, m);
    });
}

function clearReassembledLog() {
  reassembledLog && (reassembledLog.value = "");
  reassembledHexLog && (reassembledHexLog.value = "");
}

//
// Add event listener.
//

initializeDecoderButton &&
  initializeDecoderButton.addEventListener("click", initializeDecoder);
decodeButton &&
  decodeButton.addEventListener("click", decode);
clearDecodedLogButton &&
  clearDecodedLogButton.addEventListener("click", clearDecodedLog);
initializeReassemblerButton &&
  initializeReassemblerButton.addEventListener("click", initializeReassembler);
reassembleButton &&
  reassembleButton.addEventListener("click", reassemble);
clearReassembledLogButton &&
  clearReassembledLogButton.addEventListener("click", clearReassembledLog);
