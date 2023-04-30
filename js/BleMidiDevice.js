/**
 * BLE-MIDI device module.
 * @module BleMidiDevice
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright (C) Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

import {BleDevice} from "./BleDevice.js";
import {BleMidiPacket} from "./BleMidiPacket.js";

// Service UUID string for BLE-MIDI devices.
const SERVICE_UUID = "03b80e5a-ede8-4b33-a751-6ce34ec4c700";
// Characteristic UUID string for BLE-MIDI devices.
const CHARACTERISTIC_UUID = "7772e5db-3868-4112-a1a9-f2669d106bf3";

/**
 * BLE-MIDI device class.
 * @extends module:BleDevice
 */
export class BleMidiDevice extends BleDevice {
  /**
   * Constructor.
   * @param {number} retryCount - Retry count.
   * @param {number} retryInterval - Retry interval in millisecond.
   */
  constructor(retryCount = 3, retryInterval = 1000) {
    console.log("BleMidiDevice.constructor()");

    super(SERVICE_UUID, CHARACTERISTIC_UUID, retryCount, retryInterval);

    /**
     * BLE-MIDI packet class instance.
     * @member {module:BleMidiPacket.BleMidiPacket}
     */
    this.bleMidiPacket = new BleMidiPacket();
  }

  /**
   * Default handler function to be called when the value is changed.
   * @param {number} timeStamp - Timestamp in millisecond.
   * @param {ArrayBuffer} value - Changed value.
   */
  defaultHandlerValueChanged(timeStamp, value) {
    super.defaultHandlerValueChanged(timeStamp, value);

    this.bleMidiPacket.decode(timeStamp, event.target.value.buffer);
  }
}
