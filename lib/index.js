'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _promise = require('jayson/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var XCPDClient = {};

XCPDClient.connect = function (opts) {
    opts = opts || {};

    var clientOpts = {};
    clientOpts.port = opts.port || 4000;
    clientOpts.host = opts.host || 'localhost';

    var auth = null;
    if (opts.username != null && opts.password != null) {
        clientOpts.auth = opts.username + ':' + opts.password;
    }

    var client = _promise2.default.client.http(clientOpts);

    // ------------------------------------------------------------------------

    var xcpdClient = {};

    xcpdClient.getAssetInfo = function (assetName) {
        return xcpdClient.call('get_asset_info', { assets: [assetName] }).then(function (assets) {
            return assets[0];
        });
    };

    // returns balances for an address in the form of
    // {
    //      TOKENLY: 900000000,
    //      LTBCOIN: 12345647890
    // }
    // All balances are integers.  Divisible assets should be divided by 100000000 to determine the balance.
    xcpdClient.getBalances = function (address) {
        var querySpec = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        // $result = $client->execute('get_balances', array('filters' => array('field' => 'address', 'op' => '==', 'value' => '1NFeBp9s5aQ1iZ26uWyiK2AYUXHxs7bFmB')));

        var query = _extends({
            filters: { address: address }
        }, querySpec);
        return xcpdClient.call('get_balances', xcpdClient.buildQuery(query)).then(function (result) {
            // console.log('result', result);
            var balances = {};
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = result[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var entry = _step.value;

                    balances[entry.asset] = entry.quantity;
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return balances;
        });
    };

    xcpdClient.buildQuery = function (querySpec) {
        var query = {};

        var filters = [];
        if (querySpec.filters != null && _typeof(querySpec.filters) === 'object') {
            for (var field in querySpec.filters) {
                if (querySpec.filters.hasOwnProperty(field)) {
                    var spec = querySpec.filters[field];
                    var value = void 0;
                    var op = '==';
                    if (field !== null && (typeof field === 'undefined' ? 'undefined' : _typeof(field)) === 'object') {
                        op = spec.op;
                        value = spec.value;
                    } else {
                        value = spec;
                    }

                    filters.push(_defineProperty({
                        field: field,
                        op: op,
                        value: value }, 'value', value));
                }
            }
        }
        query.filters = filters;

        var _arr = ['filterop', 'order_by', 'order_dir'];
        for (var _i = 0; _i < _arr.length; _i++) {
            var allowedKey = _arr[_i];
            if (querySpec[allowedKey] != null) {
                query[allowedKey] = querySpec[allowedKey];
            }
        }

        return query;
    };

    // ------------------------------------------------------------------------

    xcpdClient.call = function (method, args) {
        return client.request(method, args).then(xcpdClient.parseResponse);
    };

    xcpdClient.parseResponse = function (rawResponseData) {
        return rawResponseData.result;
    };

    return xcpdClient;
};

exports.default = XCPDClient;