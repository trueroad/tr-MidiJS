/**
 * MIDI filter module.
 * @module MidiFilter
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright (C) Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

/**
 * MIDI filter class.
 */
export class MidiFilter {
  /**
   * Constructor.
   * @param {number[]} filterStatusByte - Status bytes to filer.
   */
  constructor(filterStatusByte = [0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6,
                                  0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd,
                                  0xfe, 0xff]) {
    console.log("MidiFilter.constructor()");

    this.filterStatusByte = filterStatusByte;

    /**
     * Specify a handler function to be called
     *     when a MIDI message  is filtered.
     *     If null, the default handler is called.
     * @member {?module:MidiFilter.MidiFilter~HandlerMidiMessage}
     */
    this.handlerMidiMessageFiltered = null;

    this.initialize();
  }

  /**
   * Initializes the filter's internal state
   * and sets the first delta time in the next filtering result to 0.
   */
  initialize() {
    this._deltaUnadded = 0;
  }

  /**
   * Filter MIDI messages.
   * @param {number} delta - Delta time in millisecond.
   * @param {Uint8Array} message - MIDI message.
   */
  filter(delta, message) {
    for (let f of this.filterStatusByte) {
      if (message[0] === f) {
        // Filter.
        this._deltaUnadded += delta;
        return;
      }
    }

    // Thru.
    if (this.handlerMidiMessageFiltered) {
      this.handlerMidiMessageFiltered(this._deltaUnadded + delta,
                                      message);
    } else {
      this.defaultHandlerMidiMessageFiltered(this._deltaUnadded + delta,
                                             message);
    }
    this._deltaUnadded = 0;
  }

  /**
   * Handler function to be called
   *     when a MIDI message is filtered.
   * @callback module:MidiFilter.MidiFilter~HandlerMidiMessage
   * @param {number} delta - Delta time in millisecond.
   * @param {Uint8Array} message - MIDI message.
   */

  /**
   * Default handler function to be called
   *     when a MIDI message is filtered.
   * @param {number} delta - Delta time in millisecond.
   * @param {Uint8Array} message - MIDI message (filtered).
   */
  defaultHandlerMidiMessageFiltered(delta, message) {
    console.log("  filtered: " +
                JSON.stringify({"delta": delta,
                                "message": Array.from(message)}));
  }
}
