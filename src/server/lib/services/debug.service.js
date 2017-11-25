"use strict";
const r_clr = '\x1b[41m'; //red bg color
const g_clr = '\x1b[42m'; //green bg color
const b_clr = '\x1b[44m'; //blue bg color
const w_clr = '\x1b[0m'; //white bg color

var dbg = require('debug')('pushup:server');

class debug {

    static error(msg){
        dbg(r_clr + msg + w_clr);
    }

    static status(msg){
        dbg(b_clr + msg + w_clr);
    }

    static correct(msg){
        dbg(g_clr + msg + w_clr);
    }
}

module.exports = debug;