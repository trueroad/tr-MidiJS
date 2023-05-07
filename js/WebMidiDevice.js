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
     * Specify a handler function to be called when MIDI port state is changed.
     *     If null, the default handler is called.
     * @member {?module:WebMidiDevice.WebMidiDevice~HandlerMidiStateChanged}
     */
    this.handlerMidiStateChanged = null;
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

    this._access = null;
    this._input = null;
    this._eventTimestampBefore = null;

    this._onStateChangeBinded = this.onStateChange.bind(this);
    this._onMidiMessageBinded = this.onMidiMessage.bind(this);
  }

  /**
   * Initialize MIDI IN/OUT port.
   */
  async initialize() {
    console.log("WebMidiDevice.initialize()");

    if (this._access) {
      this._access.removeEventListener("statechange",
                                       this._onStateChangeBinded);
      this._access = null;
    }

    try {
      this._access = await navigator.requestMIDIAccess({sysex: true,
                                                        software: true});
    } catch (err) {
      console.log("WebMidiDevice.initialize(): " +
                  "navigator.requestMIDIAccess() error: " + err);
      throw err;
    }

    this._access.addEventListener("statechange", this._onStateChangeBinded);
  }

  /**
   * Build MIDI IN/OUT port list.
   */
  async buildMidiPortList() {
    console.log("WebMidiDevice.buildMidiPortList()");

    if (!this._access) {
      await this.initialize();
    }

    this._inputList = {};
    this.inputIDs = [];
    for (const input of this._access.inputs.values()) {
      this._inputList[input.id] = input;
      this.inputIDs.push(input.id);
    }

    this._outputList = {};
    this.outputIDs = [];
    for (const output of this._access.outputs.values()) {
      this._outputList[output.id] = output;
      this.outputIDs.push(output.id);
    }
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
   * Event listener for "onstatechange".
   * @param {Event} event - Information of the event.
   */
  onStateChange(event) {
    if (this.handlerMidiStateChanged) {
      this.handlerMidiStateChanged(event.port.id,
                                   event.port.type,
                                   event.port.state,
                                   event.port.connection);
    } else {
      this.defaultHandlerMidiStateChanged(event.port.id,
                                          event.port.type,
                                          event.port.state,
                                          event.port.connection);
    }
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
   * Handler function to be called when MIDI port state is changed.
   * @callback module:WebMidiDevice.WebMidiDevice~HandlerMidiStateChanged
   * @param {string} id - MIDI IN/OUT port ID.
   * @param {string} type - MIDI IN/OUT port type.
   *     "input": MIDI IN port., "output": MIDI OUT port.
   * @param {string} state - MIDI IN/OUT port device state.
   *     "disconnected": The device is disconnected from the system.,
   *     "connected": The device is connected.
   * @param {string} connection - MIDI IN/OUT port connection state.
   *     "open", "closed", "pending"
   */

  /**
   * Default handler function to be called when MIDI port state is changed.
   * @param {string} id - MIDI IN/OUT port ID.
   * @param {string} type - MIDI IN/OUT port type.
   * @param {string} state - MIDI IN/OUT port device state.
   * @param {string} connection - MIDI IN/OUT port connection state.
   */
  defaultHandlerMidiStateChanged(id, type, state, connection) {
    console.log("*** MIDI port state is changed ***");
    console.log("  port ID: " + id);
    console.log("  type: " + type);
    console.log("  state: " + state);
    console.log("  connection: " + connection);
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
