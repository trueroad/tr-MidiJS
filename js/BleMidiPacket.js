/**
 * BLE-MIDI packet module.
 * @module BleMidiPacket
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

/**
 * BLE-MIDI packet class.
 */
export class BleMidiPacket {
  /**
   * Constructor.
   */
  constructor() {
    console.log("BleMidiPacket.constructor()");

    /**
     * Specify a handler function to be called
     *     when a MIDI message (fragmented) is decoded.
     *     If null, the default handler is called.
     * @member {?module:BleMidiPacket.BleMidiPacket~HandlerMidiMessage}
     */
    this.handlerMidiMessageDecoded = null;
    /**
     * Specify a handler function to be called
     *     when fragmented MIDI messages are reassembled.
     *     If null, the default handler is called.
     * @member {?module:BleMidiPacket.BleMidiPacket~HandlerMidiMessage}
     */
    this.handlerMidiMessageReassembled = null;
    /**
     * Error threshold in millisecond to determine
     *     that the timestamp is unstable.
     * @type {number}
     */
    this.timestampErrorThreshold = 100;
    /**
     * Timeout in millisecond to wait for unstable timestamp to stable.
     * @type {number}
     */
    this.timeoutUnstableTimestamp = 500;

    this.initializeDecoder();
    this.initializeReassembler();
  }

  /**
   * Initializes the decoder's internal state
   * and sets the first delta time in the next decoding result to 0.
   */
  initializeDecoder() {
    this._bleTimestampHigh = null;
    this._bleTimestampLow = null;
    this._bleTimestampBefore = null;
    this._eventTimestampBefore = null;
    this._deltaUnaddedDecode = 0;
    this._bWaitUntilStable = true;
    setTimeout(() => {
      if (this._bWaitUntilStable) {
        console.log("BleMidiPacket.initializeDecoder(): " +
                    "Timeout waiting for timestamp stabilization.");
        this._bWaitUntilStable = false;
      }
    }, this.timeoutUnstableTimestamp);
  }

  /**
   * Initializes the reassembler's internal state
   * and sets the first delta time in the next reassembling result to 0.
   */
  initializeReassembler() {
    this._bufferSysex = [];
    this._bufferSysrt = [];
    this._deltaUnaddedReassembly = 0;
    this._deltaSysexStart = 0;
    this._deltaAfter = 0;
  }

  /**
   * Decode BLE-MIDI packet.
   * @param {number} timeStamp - Event timestamp in millisecond.
   * @param {ArrayBuffer} value - Value
   *     that contains a BLE-MIDI packet to decode.
   */
  decode(timeStamp, value) {
    const buffer = new Uint8Array(value);

    if (buffer.byteLength < 3) {
      console.log("BleMidiPacket.decode(): Packet is too short.");
      return;
    }

    let p = 0
    if ((buffer[p] & 0xc0) !== 0x80) {
      console.log("BleMidiPacket.decode(): " +
                  "Invalid header: 0x" + buffer[p].toString(16) + ".");
      return;
    }

    const tsHigh = buffer[p++] & 0x3f;

    let bContSysex;
    let tsLow;
    if (buffer[p] & 0x80) {
      bContSysex = false;
      tsLow = buffer[p] & 0x7f;
    } else {
      bContSysex = true;
      tsLow = null;
    }
    this._setHeaderTimestamp(tsHigh, tsLow, timeStamp);

    let runningStatus = null;
    let statusByte = null;
    let delta = null;
    while (p < buffer.byteLength) {
      if (buffer[p] & 0x80 && buffer[p + 1] & 0x80) {
        // Timestamp and status byte
        tsLow = buffer[p++] & 0x7f;
        statusByte = buffer[p++];
      } else if (buffer[p] & 0x80) {
        // Timestamp and running status
        tsLow = buffer[p++] & 0x7f;
        statusByte = runningStatus;
      } else if (bContSysex) {
        // System exclusive continue
        statusByte = 0xf0;
      } else {
        // No timestamp and running status
        statusByte = runningStatus;
      }
      delta = this._calcDelta(tsLow);

      switch (statusByte & 0xf0) {
      case 0x80: // Note off
      case 0x90: // Note on
      case 0xa0: // Polyphonic key pressure
      case 0xb0: // Control change
      case 0xe0: // Pitch bend change
        this._decoded(delta, [statusByte, buffer[p++], buffer[p++]]);

        runningStatus = statusByte;
        bContSysex = false;
        break;
      case 0xc0: // Program change
      case 0xd0: // Channel pressure
        this._decoded(delta, [statusByte, buffer[p++]]);

        runningStatus = statusByte;
        bContSysex = false;
        break;
      case 0xf0: // System message
        if ((statusByte & 0xf8) === 0xf8) {
          // System realtime
          this._decoded(delta, [statusByte]);
        } else {
          // System exclusive / system common
          let a = [];
          if (!bContSysex || statusByte !== 0xf0) {
            a.push(statusByte);
          }
          while (p < buffer.byteLength) {
            if (buffer[p] & 0x80) {
              break;
            }
            a.push(buffer[p++]);
          }
          this._decoded(delta, a);

          if (statusByte === 0xf0) {
            // System exclusive
            bContSysex = true;
          } else {
            // System common
            bContSysex = false;
          }
        }
        break;
      default:
        console.log("Error: Unknown status byte. p = " + p +
                    ", statusByte = 0x" + statusByte.toString(16) + ".");
        return;
      }
    }
  }

  /**
   * Set BLE-MIDI header timestamp.
   * @private
   * @param {number} timestampHigh - timestampHigh in BLE-MIDI packet header.
   * @param {number} timestampLow - First timestampLow in BLE-MIDI packet.
   * @param {number} eventTimestamp - Event timestamp in millisecond.
   */
  _setHeaderTimestamp(timestampHigh, timestampLow, eventTimestamp) {
    this._bleTimestampHigh = timestampHigh;
    if (timestampLow !== null) {
      this._bleTimestampLow = timestampLow;
    }

    const bleTimestamp = (timestampHigh << 7) | this._bleTimestampLow;
    const bleDelta = this._bleTimestampBefore === null
          ? 0
          : bleTimestamp - this._bleTimestampBefore;
    this._bleTimestampBefore = bleTimestamp;

    const eventDelta = this._eventTimestampBefore === null
          ? 0
          : eventTimestamp - this._eventTimestampBefore;
    this._eventTimestampBefore = eventTimestamp;

    this._deltaUnaddedDecode =
      8192 * Math.round((eventDelta - bleDelta) / 8192) + bleDelta;

    if (bleDelta === 0 && eventDelta === 0) {
      console.log("BleMidiPacket._setHeaderTimestamp(): initial packet");
      return;
    }

    if (this._deltaUnaddedDecode < 0) {
      console.log("BleMidiPacket._setHeaderTimestamp(): " +
                  "Unstable timestamp: Negative delta.");
      this._deltaUnaddedDecode +=
        Math.ceil(- this._deltaUnaddedDecode / 8192) * 8192;
    } else {
      const diff = Math.abs(eventDelta - bleDelta) % 8192;
      if (this.timestampErrorThreshold < diff &&
          diff < (8192 - this.timestampErrorThreshold)) {
        console.log("BleMidiPacket._setHeaderTimestamp(): " +
                    "Unstable timestamp: Differential error exceeds " +
                    this.timestampErrorThreshold + " ms.");
        console.log("  evantDelta: " + eventDelta + " ms.");
        console.log("  bleDelta: " + bleDelta + " ms.");
        console.log("  diff: " + diff + " ms.");
      } else if (this._bWaitUntilStable) {
        console.log("BleMidiPacket._setHeaderTimestamp(): " +
                    "Stabilized timestamp");
        this._deltaUnaddedDecode = 0;
        this._bWaitUntilStable = false;
      }
    }
  }

  /**
   * Calc delta time.
   * @private
   * @param {number} timestampLow - timestampLow in BLE-MIDI packet.
   * @return {number} Delta time in millisecond.
   */
  _calcDelta(timestampLow) {
    if (timestampLow !== null) {
      if (timestampLow < this._bleTimestampLow) {
        this._bleTimestampHigh++;
      }
      this._bleTimestampLow = timestampLow;
    }

    const bleTimestamp = (this._bleTimestampHigh << 7) | this._bleTimestampLow;
    const bleDelta = bleTimestamp - this._bleTimestampBefore;
    this._bleTimestampBefore = bleTimestamp;

    const delta = this._deltaUnaddedDecode + bleDelta;
    this._deltaUnaddedDecode = 0;

    return delta;
  }

  /**
   * Construct a decoded (fragmented) MIDI message and call the handler.
   * @private
   * @param {number} delta - Delta time in millisecond.
   * @param {number[]} messageArray - MIDI message (fragmented) array.
   */
  _decoded(delta, messageArray) {
    if (this._bWaitUntilStable) {
      console.log("BleMidiPacket._decoded(): " +
                  "Discard decoding results until timestamps stabilize.");
      return;
    }

    const message = new Uint8Array(messageArray);

    if (this.handlerMidiMessageDecoded) {
      this.handlerMidiMessageDecoded(delta, message);
    } else {
      this.defaultHandlerMidiMessageDecoded(delta, message);
    }
  }

  /**
   * Reassemble fragmented MIDI messages.
   * @param {number} delta - Delta time in millisecond.
   * @param {Uint8Array} message - MIDI message (fragmented).
   */
  reassemble(delta, message) {
    if (this._bufferSysex.length === 0 &&
        this._bufferSysrt.length === 0) {
      // Sysex (system exclusive) is not continuing.
      if (message[0] !== 0xf0 && message[0] !== 0xf7) {
        // Non-sysex.
        this._reassembled(this._deltaUnaddedReassembly + delta, message);
        this._deltaUnaddedReassembly = 0;
      } else if (message[0] === 0xf0) {
        // Start sysex.
        this._bufferSysex = Array.from(message);
        this._deltaSysexStart = this._deltaUnaddedReassembly + delta;
        this._deltaUnaddedReassembly = 0;
        this._deltaSysexAfter = 0;
      } else {
        // Unexpected EOX (end of system exclusive).
        console.log("BleMidiPacket.reassemble(): Error: Unexpected EOX.");
        this._deltaUnaddedReassembly += delta;
      }
    } else {
      // Sysex is continuing.
      if (message[0] < 0x80) {
        // Continuation of sysex.
        this._bufferSysex = this._bufferSysex.concat(Array.from(message));
        this._deltaAfter += delta;
      } else if ((message[0] & 0xf8) === 0xf8) {
        // System realtime between sysex.
        this._bufferSysrt.push({"delta": this._deltaAfter + delta,
                                "messageTypedArray": message});
        this._deltaAfter = 0;
      } else if (message[0] === 0xf7) {
        // EOX. Flush.
        this._bufferSysex = this._bufferSysex.concat(Array.from(message));
        this._deltaAfter += delta;

        this._flush();
      } else if (message[0] === 0xf0) {
        // Sysex suddenly aborted by next sysex. Flush.
        this._flush();
        // Start sysex.
        this._bufferSysex = Array.from(message);
        this._deltaSysexStart = this._deltaUnaddedReassembly + delta;
        this._deltaUnaddedReassembly = 0;
        this._deltaSysexAfter = 0;
      } else {
        // Sysex suddenly aborted without EOX. Flush.
        this._flush();

        this._reassembled(this._deltaUnaddedReassembly + delta, message);
        this._deltaUnaddedReassembly = 0;
      }
    }
  }

  /**
   * Flush system exclusive and system realtime during reassembly.
   * @private
   */
  _flush() {
    // Flush system exclusive.
    this._reassembled(this._deltaSysexStart,
                      new Uint8Array(this._bufferSysex));
    // Flush system realtime.
    for (let sysrt of this._bufferSysrt) {
      this._reassembled(sysrt["delta"], sysrt["messageTypedArray"]);
    }

    this._bufferSysex = [];
    this._bufferSysrt = [];
    this._deltaUnaddedReassembly = this._deltaAfter;
    this._deltaSysexStart = 0;
    this._deltaAfter = 0;
  }

  /**
   * Call the handler for reassembled MIDI messages.
   * @private
   * @param {number} delta - Delta time in millisecond.
   * @param {Uint8Array} message - MIDI message (reassembled).
   */
  _reassembled(delta, message) {
    if (this.handlerMidiMessageReassembled) {
      this.handlerMidiMessageReassembled(delta, message);
    } else {
      this.defaultHandlerMidiMessageReassembled(delta, message);
    }
  }

  /**
   * Handler function to be called
   *     when a MIDI message is decoded or reassembled.
   * @callback module:BleMidiPacket.BleMidiPacket~HandlerMidiMessage
   * @param {number} delta - Delta time in millisecond.
   * @param {Uint8Array} message - MIDI message.
   */

  /**
   * Default handler function to be called
   *     when a MIDI message (fragmented) is decoded.
   * @param {number} delta - Delta time in millisecond.
   * @param {Uint8Array} message - MIDI message (fragmented).
   */
  defaultHandlerMidiMessageDecoded(delta, message) {
    console.log("  decoded (fragmented): " +
                JSON.stringify({"delta": delta,
                                "message": Array.from(message)}));

    this.reassemble(delta, message);
  }

  /**
   * Default handler function to be called
   *     when fragmented MIDI messages are reassembled.
   * @param {number} delta - Delta time in millisecond.
   * @param {Uint8Array} message - MIDI message (reassembled).
   */
  defaultHandlerMidiMessageReassembled(delta, message) {
    console.log("  reassembled: " +
                JSON.stringify({"delta": delta,
                                "message": Array.from(message)}));
  }
}
