<!-- -*- coding: utf-8 -*- -->
# TrueRoad's MIDI JavaScript Module

[ [Japanese (日本語)](./README.ja.md) / English ]

https://github.com/trueroad/tr-MidiJS

## Demo

### Sample BLE-MIDI to SMF

https://trueroad.github.io/tr-MidiJS/sample-BLE-MIDI-to-SMF.html

Record MIDI input from BLE-MIDI and output to SMF (Standard MIDI File)
using Web Bluetooth API.

### Sample BLE-MIDI to SMF continuance

https://trueroad.github.io/tr-MidiJS/sample-BLE-MIDI-to-SMF-cont.html

Using Web Bluetooth API, continuously records MIDI input from BLE-MIDI,
repeatedly detects gaps in the music, builds an SMF for each detection,
and POSTs it to a specified URL for each build.

### Sample using BleMidiDevice.js

https://trueroad.github.io/tr-MidiJS/sample-BleMidiDevice.html

Demonstration of handling BLE-MIDI devices.

### Sample using BleMidiPacket.js

https://trueroad.github.io/tr-MidiJS/sample-BleMidiPacket.html

Demonstration of handling BLE-MIDI packets.

## License

Copyright (C) 2023 Masamichi Hosoda. All rights reserved.

License: BSD-2-Clause

See [LICENSE](./LICENSE).
