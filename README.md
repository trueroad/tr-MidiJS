<!-- -*- coding: utf-8 -*- -->
# TrueRoad's MIDI JavaScript Module

[ [Japanese (日本語)](./README.ja.md) / English ]

https://github.com/trueroad/tr-MidiJS

## Demo

### BLE-MIDI (using Web Bluetooth MIDI)

* Environments in which the demo worked (2023-05-07)
    + Central
        - Windows 10 22H2 + Edge 113
        - Windows 10 22H2 + Chrome 113
        - Android 8.0.0 + Chrome 113
    + Peripheral
        - MD-BT01 firmware version 1.0.7
        - WIDI Master firmware version 0.2.0.1

#### Sample BLE-MIDI to SMF

https://trueroad.github.io/tr-MidiJS/sample-BLE-MIDI-to-SMF.html

Record MIDI input from BLE-MIDI and output to SMF (Standard MIDI File)
using Web Bluetooth API.

#### Sample BLE-MIDI to SMF continuance

https://trueroad.github.io/tr-MidiJS/sample-BLE-MIDI-to-SMF-cont.html

Using Web Bluetooth API, continuously records MIDI input from BLE-MIDI,
repeatedly detects gaps in the music, builds an SMF for each detection,
and POSTs it to a specified URL for each build.

#### Sample using BleMidiDevice.js

https://trueroad.github.io/tr-MidiJS/sample-BleMidiDevice.html

Demonstration of handling BLE-MIDI devices.

#### Sample using BleMidiPacket.js

https://trueroad.github.io/tr-MidiJS/sample-BleMidiPacket.html

Demonstration of handling BLE-MIDI packets.

### Web MIDI (using Web MIDI API, USB MIDI etc.)

* Environments in which the demo worked (2023-05-07)
    + Host
        - Windows 10 22H2 + Edge 113
        - Windows 10 22H2 + Chrome 113
    + Device
        - M4U eX

#### Sample Web MIDI to SMF

https://trueroad.github.io/tr-MidiJS/sample-WebMIDI-to-SMF.html

Record MIDI input from Web MIDI and output to SMF (Standard MIDI File)
using Web MIDI API.

#### Sample Web MIDI to SMF continuance

https://trueroad.github.io/tr-MidiJS/sample-WebMIDI-to-SMF-cont.html

Using Web MIDI API, continuously records MIDI input from Web MIDI,
repeatedly detects gaps in the music, builds an SMF for each detection,
and POSTs it to a specified URL for each build.

#### Sample using WebMidiDevice.js

https://trueroad.github.io/tr-MidiJS/sample-WebMidiDevice.html

Demonstration of handling Web MIDI devices.

## License

Copyright (C) 2023 Masamichi Hosoda. All rights reserved.

License: BSD-2-Clause

See [LICENSE](./LICENSE).
