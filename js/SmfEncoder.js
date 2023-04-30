/**
 * SMF (Standard MIDI File) encode module.
 * @module SmfEncoder
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright (C) Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

import {MidiFilter} from "./MidiFilter.js";

/**
 * SMF encoder class.
 */
export class SmfEncoder {
  /**
   * Constructor.
   */
  constructor() {
    console.log("SmfEncode.constructor()");

    /**
     * MIDI filter class instance.
     * @member {module:MidiFilter.MidiFilter}
     */
    this.midiFilter = new MidiFilter();

    this.initialize();
  }

  /**
   * Initializes the encoder's internal state.
   */
  initialize() {
    this._trackData = [];
  }

  /**
   * Encode MIDI messages.
   * @param {number} delta - Delta time in millisecond.
   * @param {Uint8Array} message - MIDI message.
   */
  encode(delta, message) {
    this._trackData =
      this._trackData.concat(this._calcVariableLengthQuantity(delta));

    if (message[0] < 0xf0) {
      // Non system message -> MIDI event
      this._trackData = this._trackData.concat(Array.from(message));
    } else if (message[0] === 0xf0) {
      // System exclusive -> sysex event f0
      const payload = message.subarray(1);
      this._trackData.push(0xf0);
      this._trackData = this._trackData.concat(
        this._calcVariableLengthQuantity(payload.byteLength));
      this._trackData = this._trackData.concat(Array.from(payload));
    } else {
      // System common / system realtime -> sysex event f7
      this._trackData.push(0xf7);
      this._trackData = this._trackData.concat(
        this._calcVariableLengthQuantity(message.byteLength));
      this._trackData = this._trackData.concat(Array.from(message));
    }
  }

  /**
   * Meta event (text).
   * @param {number} delta - Delta time.
   * @param {number} type - Meta event type.
   *     1: text, 2: copyright, 3: track name, 4: instrument name,
   *     5: lyrics, 6: marker, 7: cue marker, 9: device name, etc.
   * @param {string} text - Meta event payload.
   */
  meta_text(delta, type, text) {
    this._trackData =
      this._trackData.concat(this._calcVariableLengthQuantity(delta));

    let utf8Bytes = new TextEncoder().encode(text);
    let bUtf8 = false;
    for (const byte of utf8Bytes) {
      if (byte > 127) {
        bUtf8 = true;
        break;
      }
    }

    if (bUtf8) {
      utf8Bytes = new TextEncoder().encode("{@UTF-8}" + text);
    }

    this._trackData.push(0xff);
    this._trackData.push(type);
    this._trackData = this._trackData.concat(
      this._calcVariableLengthQuantity(utf8Bytes.byteLength));
    this._trackData = this._trackData.concat(Array.from(utf8Bytes));
  }

  /**
   * Meta event (binary).
   * @param {number} delta - Delta time.
   * @param {number} type - Meta event type.
   *     0x00: sequence number, 0x20: channel prefix,
   *     0x58: time signature, 0x59: key signature, etc.
   * @param {Uint8Array} binary - Meta event payload.
   */
  meta_binary(delta, type, binary) {
    this._trackData =
      this._trackData.concat(this._calcVariableLengthQuantity(delta));

    this._trackData.push(0xff);
    this._trackData.push(type);
    this._trackData = this._trackData.concat(
      this._calcVariableLengthQuantity(binary.byteLength));
    this._trackData = this._trackData.concat(Array.from(binary));
  }

  /**
   * Build SMF (Standard MIDI File).
   * @return {Blob} SMF.
   */
  build() {
    // Tempo: quater note duration is 480 millisecond.
    // 480 millisecond = 480000 microsecond = 0x75300
    const setTempo = [0xff, 0x51, 0x03, 0x07, 0x53, 0x00];
    // End of track
    const endOfTrack = [0xff, 0x2f, 0x00];

    const track = [0x00,  // delta 0
                   ...setTempo,
                   ...this._trackData,
                   0x00,  // delta 0
                   ...endOfTrack];

    let buffer = [0x4d, 0x54, 0x68, 0x64,  // MThd
                  0x00, 0x00, 0x00, 0x06,  // Length: 6 bytes
                  0x00, 0x00,  // Format: 0
                  0x00, 0x01,  // Number of tracks: 1
                  0x01, 0xe0,  // Division: 480
                  0x4d, 0x54, 0x72, 0x6b,  // MTrk
                  ...this._convertLength4(track.length),
                  ...track];

    return new Blob([new Uint8Array(buffer)], {type: "audio/midi"});
  }

  /**
   * Calc variable length quantity.
   * @private
   * @param {number} delta - Delta time.
   * @return {number[]} Calculated bytes.
   */
  _calcVariableLengthQuantity(delta) {
    let retval = [];

    if (delta > 0x1fffff) {
      retval.push(((delta & 0x0fe00000) >> 21) | 0x80);
    }
    if (delta > 0x3fff) {
      retval.push(((delta & 0x3fc000) >> 14) | 0x80);
    }
    if (delta > 0x7f) {
      retval.push(((delta & 0x3f80) >> 7) | 0x80);
    }
    retval.push(delta & 0x7f);

    return retval;
  }

  /**
   * Convert length to four bytes.
   * @private
   * @param {number} length - Length.
   * @return {number[]} Converted lendth bytes.
   */
  _convertLength4(length) {
    return [(length & 0xff000000) >> 24,
            (length & 0xff0000) >> 16,
            (length & 0xff00) >> 8,
            length & 0xff];
  }
}
