'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _promise = require('jayson/promise');

var _promise2 = _interopRequireDefault(_promise);

var _assetCache = require('./assetCache');

var _assetCache2 = _interopRequireDefault(_assetCache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var XCPDClient = {};

var SATOSHI = 100000000;

XCPDClient.connect = function (opts) {
    opts = opts || {};

    var clientOpts = {};
    clientOpts.port = opts.port || 4000;
    clientOpts.host = opts.host || 'localhost';
    clientOpts.cacheFile = opts.cacheFile || null;

    var auth = null;
    if (opts.username != null && opts.password != null) {
        clientOpts.auth = opts.username + ':' + opts.password;
    }

    var client = _promise2.default.client.http(clientOpts);

    var useDivisibleCache = false;
    var divisibleCache = null;
    if (clientOpts.cacheFile != null) {
        useDivisibleCache = true;
        divisibleCache = _assetCache2.default.connect(clientOpts.cacheFile);
    }

    // ------------------------------------------------------------------------

    var xcpdClient = {};

    xcpdClient.getAssetInfo = function (assetName) {
        return xcpdClient.call('get_asset_info', { assets: [assetName] }).then(function (assets) {
            return assets[0];
        });
    };

    // returns a Promise with isDivisible
    xcpdClient.isDivisible = function (assetName) {
        if (!useDivisibleCache) {
            return buildIsDivisible(assetName);
        }

        return divisibleCache.isDivisible(assetName).then(function (isDivisible) {
            if (isDivisible === null) {
                return buildIsDivisible(assetName).then(function (isDivisible) {
                    divisibleCache.put(assetName, { divisible: isDivisible });
                    return isDivisible;
                });
            } else {
                return isDivisible;
            }
        });
    };

    // returns all token balances for an address in the form of
    // [
    //     {
    //         asset: 'TOKENLY',
    //         quantity: 900000000,
    //         divisible: true,
    //         quantityFloat: 9.0
    //     },
    //     {
    //         asset: 'INDIVISIBLETKN',
    //         quantity: 16,
    //         divisible: false,
    //         quantityFloat: 16.0
    //     }
    // ]
    // quantity is an integer.  Divisible assets are divided by 100000000 to determine the quantityFloat.
    xcpdClient.getBalances = function (address) {
        var querySpec = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        // $result = $client->execute('get_balances', array('filters' => array('field' => 'address', 'op' => '==', 'value' => '1NFeBp9s5aQ1iZ26uWyiK2AYUXHxs7bFmB')));

        var query = _extends({
            filters: { address: address }
        }, querySpec);
        return xcpdClient.call('get_balances', xcpdClient.buildQuery(query)).then(function (result) {
            var isDivisiblePromises = [];
            // console.log('result', result);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                var _loop = function _loop() {
                    var entry = _step.value;

                    isDivisiblePromises.push(xcpdClient.isDivisible(entry.asset).then(function (isDivisible) {
                        return {
                            asset: entry.asset,
                            quantity: entry.quantity,
                            divisible: isDivisible,
                            quantityFloat: isDivisible ? entry.quantity / SATOSHI : entry.quantity
                        };
                    }));
                };

                for (var _iterator = result[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    _loop();
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

            return Promise.all(isDivisiblePromises);
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

    xcpdClient.close = function () {
        if (useDivisibleCache) {
            return divisibleCache.close();
        }
        return new Promise(function (resolve) {
            resolve(true);
        });
    };

    // ------------------------------------------------------------------------

    xcpdClient.getDivisibleCache = function () {
        return divisibleCache;
    };

    xcpdClient.call = function (method, args) {
        return client.request(method, args).then(xcpdClient.parseResponse);
    };

    xcpdClient.parseResponse = function (rawResponseData) {
        return rawResponseData.result;
    };

    // ------------------------------------------------------------------------

    function buildIsDivisible(assetName) {
        return xcpdClient.getAssetInfo(assetName).then(function (assetInfo) {
            if (assetInfo == null) {
                return null;
            }
            return assetInfo.divisible;
        });
    }

    // ------------------------------------------------------------------------

    return xcpdClient;
};

exports.default = XCPDClient;