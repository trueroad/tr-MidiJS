/**
 * Gap detector module.
 * @module GapDetector
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright (C) Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

/**
 * Gap detector class.
 */
export class GapDetector {
  /**
   * Constructor.
   */
  constructor() {
    console.log("GapDetector.constructor()");

    /**
     * Minimum no-message period in milliseconds to be detected as a gap.
     * @type {number}
     */
    this.minNoMessagePeriodAsGap = 1000;
    /**
     * Specify a handler function to be called when a gap is detected.
     *     If null, the default handler is called.
     * @member {?module:GapDetector.GapDetector~HandlerGapDetected}
     */
    this.handlerGapDetected = null;

    this.initialize();
  }

  /**
   * Initializes the detector's internal state.
   */
  initialize() {
    this._timeoutID = undefined;
    this._bNoNotes = true;
    this._bNoPedals = true;
    this._bInGap = true;

    this._notes = [];
    this._damper_pedals = [];
    this._sostenuto_pedals = [];
    for (let i = 0; i < 16; i++) {
      this._notes[i] = [];
      this._damper_pedals[i] = 0;
      this._sostenuto_pedals[i] = 0;
      for (let j = 0; j < 128; j++) {
        this._notes[i][j] = 0;
      }
    }
  }

  /**
   * Is in gap?
   * @return {bool} If true, in gap. False otherwise.
   */
  isInGap() {
    return this._bInGap;
  }

  /**
   * Detect gaps between groups of notes.
   * @param {number} delta - Delta time in millisecond.
   * @param {Uint8Array} message - MIDI message.
   */
  detect(delta, message) {
    if (this._timeoutID) {
      clearTimeout(this._timeoutID);
      this._timeoutID = undefined;
    }

    if (!this._bInGap && this._bNoNotes && this._bNoPedals &&
        delta >= this.minNoMessagePeriodAsGap) {
      console.log("GapDetector.detect(): Delta equals or longer than " +
                  this.minNoMessagePeriodAsGap + " ms.");
      this._detected_gap();
    }
    this._bInGap = false;

    switch (message[0] & 0xf0) {
    case 0x80:
      this._note_off(message[0] & 0xf, message[1]);
      break;
    case 0x90:
      if (message[2] !== 0) {
        this._note_on(message[0] & 0xf, message[1]);
      } else {
        this._note_off(message[0] & 0xf, message[1]);
      }
      break;
    case 0xb0:
      switch (message[1]) {
      case 0x40:
        // Hold1 / damper pedal
        this._damper_pedal(message[0] & 0xf, message[2]);
        break;
      case 0x42:
        // Sostenuto pedal
        this._sostenuto_pedal(message[0] & 0xf, message[2]);
        break;
      case 0x78:
      case 0x79:
      case 0x7a:
      case 0x7b:
      case 0x7c:
      case 0x7d:
      case 0x7e:
      case 0x7f:
        // Channel mode message
        this._channnel_mode_message();
        break;
      default:
        break;
      }
      break;
    default:
      break;
    }

    if (this._bNoNotes && this._bNoPedals) {
      this._timeoutID = setTimeout(() => {
        this._bInGap = true;
        console.log("GapDetector.detect(): Timeout.");
        this._detected_gap();
      }, this.minNoMessagePeriodAsGap);
    }
  }

  /**
   * Note on.
   * @private
   * @param {number} channel - MIDI channel.
   * @param {number} noteno - MIDI note number.
   */
  _note_on(channel, noteno) {
    this._notes[channel][noteno]++;
    this._bNoNotes = false;
  }

  /**
   * Note off.
   * @private
   * @param {number} channel - MIDI channel.
   * @param {number} noteno - MIDI note number.
   */
  _note_off(channel, noteno) {
    if (--this._notes[channel][noteno] < 0) {
      this._notes[channel][noteno] = 0;
    }

    if (!this._isNoteOn()) {
      this._bNoNotes = true;
    }
  }

  /**
   * Damper pedal.
   * @private
   * @param {number} channel - MIDI channel.
   * @param {number} value - pedal value.
   */
  _damper_pedal(channel, value) {
    this._damper_pedals[channel] = value;

    if (value === 0) {
      if (!this._isPedalOn()) {
        this._bNoPedals = true;
      }
    } else {
      this._bNoPedals = false;
    }
  }

  /**
   * Sostenuto pedal.
   * @private
   * @param {number} channel - MIDI channel.
   * @param {number} value - pedal value.
   */
  _sostenuto_pedal(channel, value) {
    this._sostenuto_pedals[channel] = value;

    if (value === 0) {
      if (!this._isPedalOn()) {
        this._bNoPedals = true;
      }
    } else {
      this._bNoPedals = false;
    }
  }

  /**
   * Channel mode message.
   * @private
   */
  _channel_mode_message() {
    this.initialize();
  }

  /**
   * Is there a note that is on?
   * @private
   * @return {bool} true if there is a note that is on.
   */
  _isNoteOn() {
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 128; j++) {
        if (this._notes[i][j] !== 0) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Is there a pedal that is on?
   * @private
   * @return {bool} true if there is a pedal that is on.
   */
  _isPedalOn() {
    for (let i = 0; i < 16; i++) {
      if (this._damper_pedals[i] !== 0 || this._sostenuto_pedals[i] !== 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Detected a gap.
   * @private
   */
  _detected_gap() {
    if (this.handlerGapDetected) {
      this.handlerGapDetected();
    } else {
      this.defaultHandlerGapDetected();
    }
  }

  /**
   * Handler function to be called when a gap is detected.
   * @callback module:GapDetector.GapDetector~HandlerGapDetected
   */

  /**
   * Default handler function to be called when a gap is detected.
   */
  defaultHandlerGapDetected() {
    console.log("*** Gap detected ***");
  }
}
