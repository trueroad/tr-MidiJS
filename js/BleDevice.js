/**
 * BLE device module.
 * @module BleDevice
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright (C) Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

/** BLE device class. */
export class BleDevice {
  /**
   * Constructor.
   * @param {string} serviceUuid - Service UUID string. 
   * @param {string} characteristicUuid - Characteristic UUID string. 
   * @param {number} retryCount - Retry count.
   * @param {number} retryInterval - Retry interval in millisecond.
   */
  constructor(serviceUuid, characteristicUuid,
              retryCount = 3, retryInterval = 1000) {
    console.log("BleDevice.constructor()");

    this.serviceUuid = serviceUuid;
    this.characteristicUuid = characteristicUuid;
    this.retryCount = retryCount;
    this.retryInterval = retryInterval;

    /**
     * Specify a handler function to be called when the value is changed.
     *     If null, the default handler is called.
     * @member {?module:BleDevice.BleDevice~HandlerValueChanged}
     */
    this.handlerValueChanged = null;

    this._device = null;
    this._characteristic = null;

    this._onDisconnectedBinded = this.onDisconnected.bind(this);
    this._onValueChangedBinded = this.onValueChanged.bind(this);
  }

  /**
   * Select a device using a UI chooser.
   */
  async select() {
    console.log("BleDevice.select()");

    if (this._device) {
      console.log("BleDevice.select(): this._device is not empty.");
      if (this._device.gatt.connected) {
        await this.disconnect();
      }
      this._device = null;
    }
    if (this._characteristic) {
      console.log("BleDevice.select(): this._characteristic is not empty.");
      this._characteristic = null;
    }

    try {
      this._device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: false,
        filters: [{services: [this.serviceUuid]}]
      });
    } catch (err) {
      console.log("BleDevice.select(): " +
                  "navigator.bluetooth.requestDevice() error: " + err);
      throw err;
    }
  }

  /**
   * Connect the selected device.
   */
  async connect() {
    console.log("BleDevice.connect()");

    if (!this._device) {
      console.log("BleDevice.connect(): this._device is empty.");
      throw new Error("BleDevice.connect(): this._device is empty.");
    }

    if (this._device.gatt.connected) {
      console.log("BleDevice.connect(): Already connected.");
      return;
    }

    this._device.addEventListener("gattserverdisconnected",
                                  this._onDisconnectedBinded);

    for (let i = 0;; i++) {
      try {
        const server = this._device.gatt.connected
              ? this._device.gatt
              : await this._device.gatt.connect();
        const service = await server.getPrimaryService(this.serviceUuid);
        this._characteristic =
          await service.getCharacteristic(this.characteristicUuid);
      } catch (err) {
        console.log("BleDevice.connect(): Error: " + err);
        if (i > this.retryCount) {
          console.log("BleDevice.connect(): Retry count exceeded.");
          throw err;
        }
        console.log("BleDevice.connect(): Waiting retry interval.");
        await new Promise(resolve => setTimeout(resolve, this.retryInterval));
        console.log("BleDevice.connect(): Continue retry.");
        continue;
      }
      break;
    }
  }

  /**
   * Disconnect the connected device.
   */
  async disconnect() {
    console.log("BleDevice.disconnect()");

    await this.stop();
    this._characteristic = null;

    if (!this._device) {
      console.log("BleDevice.disconnect(): this._device is empty.");
      throw new Error("BleDevice.disconnect(): this._device is empty.");
    }

    if (!this._device.gatt.connected) {
      console.log("BleDevice.disconnect(): Already disconnected.");
      return;
    }

    this._device.gatt.disconnect();
    this._device.removeEventListener("gattserverdisconnected",
                                     this._onDisconnectedBinded);
  }

  /**
   * Start notification of value change from the connected device.
   */
  async start() {
    console.log("BleDevice.start()");

    if (!this._characteristic) {
      console.log("BleDevice.start(): this._characteristic is empty.");
      throw new Error("BleDevice.start(): this._characteristic is empty.");
    }

    this._characteristic.addEventListener("characteristicvaluechanged",
                                          this._onValueChangedBinded);

    for (let i = 0;; i++) {
      try {
        await this._characteristic.startNotifications();
      } catch (err) {
        console.log("BleDevice.start(): " +
                    "this._characteristic.startNotifications() error: " + err);
        if (i > this.retryCount) {
          console.log("BleDevice.start(): " +
                      "this._characteristic.startNotifications() " +
                      "retry count exceeded.");
          throw err;
        }
        console.log("BleDevice.start(): Waiting retry interval.");
        await new Promise(resolve => setTimeout(resolve, this.retryInterval));
        console.log("BleDevice.start(): Continue retrt.");
        continue;
      }
      break;
    }
  }

  /**
   * Stop notification of value change from the connected device.
   */
  async stop() {
    console.log("BleDevice.stop()");
    if (!this._characteristic) {
      console.log("BleDevice.stop(): this._characteristic is empty.");
      throw new Error("BleDevice.stop(): this._characteristic is empty.");
    }

    for (let i = 0;; i++) {
      try {
        await this._characteristic.stopNotifications();
      } catch (err) {
        console.log("BleDevice.stop(): " +
                    "this._characteristic.stopNotifications() error: " + err);
        if (i > this.retryCount) {
          console.log("BleDevice.stop(): " +
                      "this._characteristic.stopNotifications() " +
                      "retry count exceeded.");
          throw err;
        }
        console.log("BleDevice.stop(): Waiting retry interval.");
        await new Promise(resolve => setTimeout(resolve, this.retryInterval));
        console.log("BleDevice.stop(): Continue retry.");
        continue;
      }
      break;
    }

    this._characteristic.removeEventListener("characteristicvaluechanged",
                                             this._onValueChangedBinded);
  }

  /**
   * Write value to the characteristic.
   * @param {ArrayBuffer} value - Value to write.
   */
  async write(value) {
    console.log("BleDevice.write()");

    if (!this._characteristic) {
      console.log("BleDevice.write(): this._characteristic is empty.");
      throw new Error("BleDevice.write(): this._characteristic is empty.");
    }

    for (let i = 0;; i++) {
      try {
        await this._characteristic.writeValueWithoutResponse(value);
      } catch (err) {
        console.log("BleDevice.write(): " +
                    "this._characteristic.writeValueWithoutResponse() " +
                    "error: " + err);
        if (i > this.retryCount) {
          console.log("BleDevice.write(): " +
                      "this._characteristic.writeValueWithoutResponse() " +
                      "retry count exceeded.");
          throw err;
        }
        console.log("BleDevice.write(): Waiting retry interval.");
        await new Promise(resolve => setTimeout(resolve, this.retryInterval));
        console.log("BleDevice.write(): Continue retry.");
        continue;
      }
      break;
    }
  }

  /**
   * Is connected?
   * @return {?boolean} true if connected, false otherwise. null on error.
   */
  isConnected() {
    console.log("BleDevice.isConnected()");

    if (!this._device) {
      console.log("BleDevice.isConnected(): this._device is empty.");
      return null;
    }

    return this._device.gatt.connected;
  }

  /**
   * Get device name.
   * @return {?string} Device name. null on error.
   */
  getDeviceName() {
    console.log("BleDevice.getDeviceName()");

    if (!this._device) {
      console.log("BleDevice.getDeviceName(): this._device is empty.");
      return null;
    }

    return this._device.name;
  }

  /**
   * Event listener for "gattserverdisconnected".
   */
  onDisconnected() {
    console.log("BleDevice.onDisconnected()");
    this._characteristic = null;
  }

  /**
   * Event listener for "characteristicvaluechanged".
   * @param {Event} event - Information of the event.
   */
  onValueChanged(event) {
    if (event.timeStamp === undefined) {
      console.log("BleDevice.onValueChanged(): event.timeStamp is undefined.");
    }

    const timeStamp = event.timeStamp === undefined
          ? new Date().getTime()
          : event.timeStamp;

    if (this.handlerValueChanged) {
      this.handlerValueChanged(timeStamp, event.target.value.buffer);
    } else {
      this.defaultHandlerValueChanged(timeStamp, event.target.value.buffer);
    }
  }

  /**
   * Handler function to be called when the value is changed.
   * @callback module:BleDevice.BleDevice~HandlerValueChanged
   * @param {number} timeStamp - Timestamp in millisecond.
   * @param {ArrayBuffer} value - Changed value.
   */

  /**
   * Default handler function to be called when the value is changed.
   * @param {number} timeStamp - Timestamp in millisecond.
   * @param {ArrayBuffer} value - Changed value.
   */
  defaultHandlerValueChanged(timeStamp, value) {
    console.log("*** Value changed ***");

    const v = new Uint8Array(value);
    let a = [];
    for (let i = 0; i < v.byteLength; i++) {
      a.push("0x" + v[i].toString(16).padStart(2, "0"));
    }
    console.log("  timeStamp: " + timeStamp);
    console.log("  value: " + a.join(" "));

    const ns = timeStamp * 1000;
    console.log("  " + JSON.stringify({"ns": ns, "data": Array.from(v)}));
  }
}
