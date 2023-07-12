/**
 * Check BLE-MIDI.
 * @module check-BLE-MIDI
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright (C) Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

import {BleMidiDevice} from "../js/BleMidiDevice.js";

/**
 * BleMidiDevice class instance.
 * @type {module:BleMidiDevice.BleMidiDevice}
 */
export const bleMidiDevice = new BleMidiDevice();

//
// Element ID
//

// Button
const selectConnectButton = document.getElementById("selectConnectButton");

// Status span
const statusSpan = document.getElementById("statusSpan");

//
// UI function
//

async function selectConnect() {
  if (bleMidiDevice.isConnected()) {
    statusSpan.innerText = "切断中...";
    try {
      await bleMidiDevice.disconnect();
    } catch (err) {
      statusSpan.innerText = err;
      return;
    }
  }

  statusSpan.innerText = "初期化中...";

  bleMidiDevice.bleMidiPacket.initializeDecoder();
  bleMidiDevice.bleMidiPacket.initializeReassembler();

  statusSpan.innerText = "選択中...";

  try {
    await bleMidiDevice.select();
  } catch (err) {
    statusSpan.innerText = err;
    return;
  }

  statusSpan.innerText = "接続中...";

  try {
    await bleMidiDevice.connect();
  } catch (err) {
    statusSpan.innerText = err;
    return;
  }

  statusSpan.innerText = "\"" +
    bleMidiDevice.getDeviceName() + "\"はBluetooth MIDI (BLE-MIDI)対応です";

  await bleMidiDevice.disconnect();
}

//
// Add event listener
//

selectConnectButton &&
  selectConnectButton.addEventListener("click", selectConnect);
