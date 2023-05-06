/**
 * Web MIDI device module.
 * @module WebMidiDevice
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright (C) Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

/**
 * Web MIDI device class.
 */
export class WebMidiDevice {
  /**
   * Constructor.
   */
  constructor() {
    console.log("WebMidiDevice.constructor()");

    /**
     * Specify a handler function to be called when a MIDI message is received.
     *     If null, the default handler is called.
     * @member {?module:WebMidiDevice.WebMidiDevice~HandlerMidiMessageReceived}
     */
    this.handlerMidiMessageReceived = null;

    /**
     * MIDI IN port IDs.
     * @type {string[]}
     */
    this.inputIDs = [];
    /**
     * MIDI OUT port IDs.
     * @type {string[]}
     */
    this.outputIDs = [];

    this._inputList = {};
    this._outputList = {};

    this._input = null;
    this._eventTimestampBefore = null;

    this._onMidiMessageBinded = this.onMidiMessage.bind(this);
  }

  /**
   * Build MIDI IN/OUT port list.
   */
  async buildMidiPortList() {
    console.log("WebMidiDevice.buildMidiPortList()");

    let access;
    try {
      access = await navigator.requestMIDIAccess({sysex: true,
                                                  software: true});
    } catch (err) {
      console.log("WebMidiDevice.buildMidiPortList(): " +
                  "navigator.requestMIDIAccess() error: " + err);
      throw err;
    }

    this._inputList = {};
    this.inputIDs = [];
    access.inputs.forEach(input => {
      this._inputList[input.id] = input;
      this.inputIDs.push(input.id);
    });

    this._outputList = {};
    this.outputIDs = [];
    access.outputs.forEach(output => {
      this._outputList[output.id] = output;
      this.outputIDs.push(output.id);
    });
  }

  /**
   * Get MIDI IN port.
   * @param {string} id - MIDI IN port ID.
   * @return {MIDIInput} MIDI IN port.
   */
  getMidiInPort(id) {
    return this._inputList[id];
  }

  /**
   * Get MIDI OUT port.
   * @param {string} id - MIDI OUT port ID.
   * @return {MIDIOutput} MIDI OUT port.
   */
  getMidiOutPort(id) {
    return this._outputList[id];
  }

  /**
   * Get current MIDI IN port.
   * @return {?MIDIInput} MIDI IN port.
   *     If null, it means MIDI IN port is not used.
   */
  getCurrentMidiInPort() {
    return this._input;
  }

  /**
   * Get MIDI IN port name.
   * @param {string} id - MIDI IN port ID.
   * @return {string} MIDI IN port name.
   */
  getMidiInPortName(id) {
    return this._inputList[id].name;
  }

  /**
   * Get MIDI OUT port name.
   * @param {string} id - MIDI OUT port ID.
   * @return {string} MIDI OUT port name.
   */
  getMidiOutPortName(id) {
    return this._outputList[id].name;
  }

  /**
   * Get current MIDI IN port name.
   * @return {?string} MIDI IN port name.
   *     If null, it means MIDI IN port is not used.
   */
  getCurrentMidiInPortName() {
    if (this._input) {
      return this._input.name;
    }
    return null;
  }

  /**
   * Start receiving MIDI messages.
   * @param {string} id - MIDI IN port ID.
   */
  start(id) {
    if (this._input) {
      this.stop();
    }

    this._input = this.getMidiInPort(id);
    this._eventTimestampBefore = null;
    this._input.addEventListener("midimessage", this._onMidiMessageBinded);
  }

  /**
   * Stop receiving MIDI messages.
   */
  stop() {
    if (this._input) {
      this._input.removeEventListener("midimessage",
                                      this._onMidiMessageBinded);
      this._input = null;
    }
  }

  /**
   * Send MIDI message.
   * @param {string} id - MIDI OUT port ID.
   * @param {Uint8Array} message - MIDI message to send.
   */
  send(id, message) {
    this.getMidiOutPort(id).send(message);
  }

  /**
   * Event listener for "onmidimessage".
   * @param {Event} event - Information of the event.
   */
  onMidiMessage(event) {
    const eventDelta = this._eventTimestampBefore === null
          ? 0
          : event.timeStamp - this._eventTimestampBefore;
    this._eventTimestampBefore = event.timeStamp;

    if (this.handlerMidiMessageReceived) {
      this.handlerMidiMessageReceived(eventDelta, event.data);
    } else {
      this.defaultHandlerMidiMessageReceived(eventDelta, event.data);
    }
  }

  /**
   * Handler function to be called when a MIDI message is received.
   * @callback module:WebMidiDevice.WebMidiDevice~HandlerMidiMessageReceived
   * @param {number} delta - Delta time in millisecond.
   * @param {Uint8Array} message - Received MIDI message.
   */

  /**
   * Default handler function to be called when a MIDI message is received.
   * @param {number} delta - Delta time in millisecond.
   * @param {Uint8Array} message - Received MIDI message.
   */
  defaultHandlerMidiMessageReceived(delta, message) {
    console.log("*** MIDI message recieved ***");
    console.log("  received: " +
                JSON.stringify({"delta": delta,
                                "message": Array.from(message)}));
  }
}
