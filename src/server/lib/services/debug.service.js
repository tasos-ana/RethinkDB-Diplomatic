"use strict";
const dbg = require('debug')('pushup:server');

const debug = function(){

    const r_clr = '\x1b[31m'; // red color
    const g_clr = '\x1b[32m'; // green color
    const b_clr = '\x1b[36m'; // blue color
    const w_clr = '\x1b[37m'; // white color

    return {
      error     : _error,
      status    : _status,
      correct   : _correct
    };

    function _error(msg) {
        dbg(r_clr + msg + w_clr);
    }

    function _status(msg) {
        dbg(b_clr + msg + w_clr);
    }

    function _correct(msg) {
        dbg(g_clr + msg + w_clr);
    }
}();

module.exports = debug;