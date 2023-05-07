<!-- -*- coding: utf-8 -*- -->
# TrueRoad's MIDI JavaScript Module

[ Japanese (日本語) / [English](./README.md) ]

https://github.com/trueroad/tr-MidiJS

## デモ

### BLE-MIDI （Web Bluetooth API 使用）

* デモが動作した環境 (2023-05-07)
    + Central
        - Windows 10 22H2 + Edge 113
        - Windows 10 22H2 + Chrome 113
        - Android 8.0.0 + Chrome 113
    + Peripheral
        - MD-BT01 firmware version 1.0.7
        - WIDI Master firmware version 0.2.0.1

#### BLE-MIDI 入力から SMF を作るサンプル

https://trueroad.github.io/tr-MidiJS/sample-BLE-MIDI-to-SMF.html

Web Bluetooth API を使って BLE-MIDI の MIDI 入力をレコーディングし、
SMF (Standard MIDI File) として出力します。

使用方法

1. 本サンプルの URL をブラウザで開き、
   「select connect」ボタンを押す/タップすると
   近くにある BLE-MIDI デバイスが表示されるので、
   接続したい BLE-MIDI デバイスを選択してください。
2. 「record」ボタンを押す/タップすると
   レコーディングを開始します。
3. 「stop」ボタンを押す/タップすると
   レコーディングを停止します。
4. 「download」ボタンを押す/タップすると
   レコーディングした内容を SMF 化してダウンロードします。

#### BLE-MIDI 入力から連続的に SMF を作るサンプル

https://trueroad.github.io/tr-MidiJS/sample-BLE-MIDI-to-SMF-cont.html

Web Bluetooth API を使って BLE-MIDI の MIDI 入力をレコーディングし続け、
繰り返して音楽のギャップを検出し、ギャップ毎に SMF を作成して、
指定の URL へ POST し続けます。
POST する先の Web サーバのサンプルとして
[httpd.py](./httpd.py)
を用意しています。

使用方法

1. [httpd.py](./httpd.py) を起動しておきます。
2. 本サンプルの URL をブラウザで開き、
   「URL where SMFs divided by gap are POSTed:」欄に、起動した
   [httpd.py](./httpd.py) のホスト名ポート名などを入力します。
   （本サンプルを開いたブラウザと同じホストで
   [httpd.py](./httpd.py) を起動したのであれば変更不要です。
   スマホやタブレット端末などのブラウザで動作させたいなどで
   別ホストにする場合は [httpd.py](./httpd.py) を
   http**s** 化する必要があります。）
3. 「select start」ボタンを押す/タップすると
   近くにある BLE-MIDI デバイスが表示されるので
   接続したい BLE-MIDI デバイスを選択してください。
4. そのままレコーディングが開始されます。
5. 無音（すべてのノート が OFF、ダンパーペダル OFF、ソステヌートペダル OFF）
   の状態で 1 秒以上 MIDI メッセージ（システム・リアルタイムなどを除く）
   が来なければギャップであると判断し、
   前回のギャップから今回のギャップまでの間に受信した
   MIDI メッセージから SMF を作成して、
   指定した URL へ POST する、という動作を繰り返して続けます。
6. [httpd.py](./httpd.py) は `post` というディレクトリを掘って、
   POST されてきた SMF をその中に
   `foreval-20230505T101010.000+0900.mid` のようなファイル名で
   順次格納していきます。
7. [httpd.py](./httpd.py) は
   POST のレスポンスとして受け取った日時を JSON 形式で返します。
8. ブラウザでは「POST result」の中に最後に受け取った
   POST のレスポンスなどを表示し、POST 毎に更新します。
9. 「stop」ボタンを押すとレコーディングを停止します。

なお、ギャップの無音区間は正確な長さで SMF の冒頭へ付与します。
そのためギャップが長いと SMF の冒頭に長い無音区間が生じることになりますが、
連続した SMF を連結することで
ギャップも含めて正確にレコーディング全体を再現できます。

#### BleMidiDevice.js のサンプル

https://trueroad.github.io/tr-MidiJS/sample-BleMidiDevice.html

BLE-MIDI デバイスを取り扱うデモ。

#### BleMidiPacket.js のサンプル

https://trueroad.github.io/tr-MidiJS/sample-BleMidiPacket.html

BLE-MIDI パケットを取り扱うデモ。

### Web MIDI （Web MIDI API 使用、USB MIDI など）

* デモが動作した環境 (2023-05-07)
    + Host
        - Windows 10 22H2 + Edge 113
        - Windows 10 22H2 + Chrome 113
    + Device
        - M4U eX

#### Web MIDI 入力から SMF を作るサンプル

https://trueroad.github.io/tr-MidiJS/sample-WebMIDI-to-SMF.html

Web MIDI API を使って Web MIDI の MIDI 入力をレコーディングし、
SMF (Standard MIDI File) として出力します。

使用方法

1. 本サンプルの URL をブラウザで開くと
   「MIDI IN port:」プルダウンに MIDI IN ポート一覧が出ているので、
   使用したい MIDI IN ポートを選択してください。
2. 「record」ボタンを押す/タップすると
   レコーディングを開始します。
3. 「stop」ボタンを押す/タップすると
   レコーディングを停止します。
4. 「download」ボタンを押す/タップすると
   レコーディングした内容を SMF 化してダウンロードします。

USB MIDI デバイスの追加削除などがあったら、
しばらく時間かかりますが「MIDI IN port:」プルダウンの中身も更新されます。
強制的に更新したいときは「Get MIDI port」ボタンを押してください。

#### Web MIDI 入力から連続的に SMF を作るサンプル

https://trueroad.github.io/tr-MidiJS/sample-WebMIDI-to-SMF-cont.html

Web MIDI API を使って Web MIDI の MIDI 入力をレコーディングし続け、
繰り返して音楽のギャップを検出し、ギャップ毎に SMF を作成して、
指定の URL へ POST し続けます。
POST する先の Web サーバのサンプルとして
[httpd.py](./httpd.py)
を用意しています。

使用方法

1. [httpd.py](./httpd.py) を起動しておきます。
2. 本サンプルの URL をブラウザで開き、
   「URL where SMFs divided by gap are POSTed:」欄に、起動した
   [httpd.py](./httpd.py) のホスト名ポート名などを入力します。
   （本サンプルを開いたブラウザと同じホストで
   [httpd.py](./httpd.py) を起動したのであれば変更不要です。
   スマホやタブレット端末などのブラウザで動作させたいなどで
   別ホストにする場合は [httpd.py](./httpd.py) を
   http**s** 化する必要があります。）
3. 「MIDI IN port:」プルダウンに MIDI IN ポート一覧が出ているので、
   使用したい MIDI IN ポートを選択してください。
4. 「start」ボタンを押す/タップするとレコーディングが開始されます。
5. 無音（すべてのノート が OFF、ダンパーペダル OFF、ソステヌートペダル OFF）
   の状態で 1 秒以上 MIDI メッセージ（システム・リアルタイムなどを除く）
   が来なければギャップであると判断し、
   前回のギャップから今回のギャップまでの間に受信した
   MIDI メッセージから SMF を作成して、
   指定した URL へ POST する、という動作を繰り返して続けます。
6. [httpd.py](./httpd.py) は `post` というディレクトリを掘って、
   POST されてきた SMF をその中に
   `foreval-20230505T101010.000+0900.mid` のようなファイル名で
   順次格納していきます。
7. [httpd.py](./httpd.py) は
   POST のレスポンスとして受け取った日時を JSON 形式で返します。
8. ブラウザでは「POST result」の中に最後に受け取った
   POST のレスポンスなどを表示し、POST 毎に更新します。
9. 「stop」ボタンを押すとレコーディングを停止します。

なお、ギャップの無音区間は正確な長さで SMF の冒頭へ付与します。
そのためギャップが長いと SMF の冒頭に長い無音区間が生じることになりますが、
連続した SMF を連結することで
ギャップも含めて正確にレコーディング全体を再現できます。

#### WebMidiDevice.js のサンプル

https://trueroad.github.io/tr-MidiJS/sample-WebMidiDevice.html

Web MIDI デバイスを取り扱うデモ。

## 注意

### Web Bluetooth API, Web MIDI API

[Web Bluetooth API](https://webbluetoothcg.github.io/web-bluetooth/),
[Web MIDI API](https://webaudio.github.io/web-midi-api/)
どちらも現時点ではドラフト版です。
今後仕様変更されて使えなくなる可能性があります。

### Secure context

[Web Bluetooth API](https://webbluetoothcg.github.io/web-bluetooth/),
[Web MIDI API](https://webaudio.github.io/web-midi-api/)
どちらも
[
secure context
](https://html.spec.whatwg.org/multipage/webappapis.html#secure-context)
でないと動作しません。
具体的にはブラウザのアドレスバーに出ている URL が
http**s** であるか、
htt**p** ならばホストが localhost などでなければなりません。
API を使用する部分がその URL から分割されている場合には、
アドレスバーの URL から API を使用する部分に至るまで
すべて secure context である必要があります。

上記デモページは http**s** なので問題ありません。

### Same origin

本モジュールは ES6 module となっておりますので、
基本的には呼び出し側の .html と本モジュールの .js 群が
same origin である必要があります。
具体的には .html と .js が同じスキーム・同じサイトにあれば問題ありません。
.js を CORS (Cross-Origin Resource Sharing) で別 origin
からの使用を許可するサイトに置く場合は、
.html を別サイトに置いても大丈夫です。
なお、スキームが file の場合は same origin にならず CORS も効かないので、
事実上は http**s** か htt**p** のどちらかにする必要があります
（htt**p** の場合はさらに secure context を満たして API 使用可にするため
localhost などである必要もあります）。

上記デモページはすべて http**s**
の同じサイトに置いてありますので問題ありません。

また、上記デモページで POST を使うサンプルにおいて、
POST の結果を得るためには POST 先も same origin であるか、
CORS で許可する必要があります。
[httpd.py](./httpd.py) は CORS で許可するようにしてありますので、
デモページとは別サイトでも POST の結果が得られるようになっています。

### Mixed content

http**s** のページから htt**p** のコンテンツ
を呼び出そうとするとブラウザにブロックされます。
上記デモページは http**s** なので、
POST を使うサンプルにおいて POST 先の URL が htt**p** の場合は localhost
以外だとブロックされてしまいます。

ブラウザを起動するホストと [httpd.py](./httpd.py)
を動かすホストが同一の場合は localhost でよいので問題ありません。
スマホやタブレット端末での動作を確認したい場合など、
ブラウザを起動するホストと [httpd.py](./httpd.py)
を動かすホストを別にしなければならない場合は
POST も http**s** にしなければなりません。

[httpd.py](./httpd.py) を http**s** 化するには、
適当な証明書と秘密鍵を用意して
`cert.crt`, `cert.key` ファイルとして置き、
[httpd.py](./httpd.py) の該当行のコメントアウトを外してください。
そして、スマホやタブレット端末のブラウザから
`https://192.168.0.2/` （IP アドレスは実際のものに変更してください）
などへアクセスしてみて [httpd.py](./httpd.py) が反応するか確かめてから、
上記デモページの POST を使うサンプルを開き、
「URL where SMFs divided by gap are POSTed:」欄を
デフォルトの
`http://localhost:5000/midi/evaluate`
から
`https://192.168.0.2/midi/evaluate`
（IP アドレスは実際のものに変更してください）
などへ変更してください。

## ライセンス

Copyright (C) 2023 Masamichi Hosoda. All rights reserved.

License: BSD-2-Clause

[LICENSE](./LICENSE) をご覧ください。
