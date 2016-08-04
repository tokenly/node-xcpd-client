#!/usr/bin/env node
"use strict";

var _buildClientFromCLI = require("./lib/buildClientFromCLI");

var _buildClientFromCLI2 = _interopRequireDefault(_buildClientFromCLI);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var client = (0, _buildClientFromCLI2.default)();

var address = process.argv[2];

process.stdout.write("Fetching asset balances for " + address + "...\n");
client.getBalances(address).then(function (result) {
    process.stdout.write("" + JSON.stringify(result, null, 4) + "\n");
}, function (err) {
    console.error('there was an error:', err);
});