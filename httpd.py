#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Httpd for tr-MidiJS sample-BLE-MIDI-to-SMF-cont.

https://github.com/trueroad/tr-MidiJS

Copyright (C) 2023 Masamichi Hosoda.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED.
IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
SUCH DAMAGE.
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Final, BinaryIO

from flask import Flask, Response, make_response, request


POSTDIR: Final[Path] = Path('post')
POSTFILE: Final[Path] = Path('post.bin')
app: Flask = Flask(__name__, static_folder='.', static_url_path='/')


def main() -> None:
    """Test main."""
    POSTDIR.mkdir(parents=True, exist_ok=True)
    # For IPv4
    app.run(debug=True,
            # ssl_context=('cert.crt', 'cert.key'), port=443,  # For https
            host='0.0.0.0')  # For IPv4 https
    # For IPv6
    # app.run(debug=True,
    #         # ssl_context=('cert.crt', 'cert.key'), port=443,  # For https
    #         host='::')  # For IPv6 https


@app.route('/midi/evaluate', methods=['POST', 'OPTIONS'])
def evaluate() -> Response:
    """Evaluate SMF."""
    if request.method == 'OPTIONS':
        resp_opt: Response = make_response("", 204)
        resp_opt.headers['Access-Control-Allow-Origin'] = '*'
        resp_opt.headers['Access-Control-Allow-Private-Network'] = 'true'
        resp_opt.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        resp_opt.headers['Access-Control-Max-Age'] = '180'
        return resp_opt

    dt: datetime = datetime.now(timezone.utc).astimezone()

    fpost: BinaryIO
    with open(POSTDIR / POSTFILE, 'wb') as fpost:
        fpost.write(request.get_data())

    dtstr: str = dt.isoformat(timespec='milliseconds'
                              ).replace('-', '', 2).replace(':', '')
    request.files['foreval'].save(POSTDIR / Path(f'foreval-{dtstr}.mid'))

    resp: Response = make_response({'Date': dtstr})
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Private-Network'] = 'true'
    resp.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    resp.headers['Access-Control-Max-Age'] = '180'

    return resp


if __name__ == '__main__':
    main()
