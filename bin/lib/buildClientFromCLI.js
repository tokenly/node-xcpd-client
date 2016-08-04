'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = buildXCPDClient;

var _lib = require('../../lib');

var _lib2 = _interopRequireDefault(_lib);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function buildXCPDClient() {
    var HOST = process.env.HOST;
    var PORT = process.env.PORT;
    var RPC_USERNAME = process.env.RPC_USERNAME;
    var RPC_PASSWORD = process.env.RPC_PASSWORD;

    var opts = {
        host: HOST,
        port: PORT,
        username: RPC_USERNAME,
        password: RPC_PASSWORD
    };

    return _lib2.default.connect(opts);
}