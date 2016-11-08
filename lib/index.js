'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

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

    // for a single asset name, returns the asset info
    //   for multiple asset names, returns an array of asset information
    xcpdClient.getAssetInfo = function (assetNameOrNames) {
        if (Array.isArray(assetNameOrNames)) {
            return xcpdClient.call('get_asset_info', { assets: assetNameOrNames }).then(function (assets) {
                return assets;
            });
        }

        return xcpdClient.call('get_asset_info', { assets: [assetNameOrNames] }).then(function (assets) {
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
                        return applyDivisibleProperties(isDivisible, {
                            asset: entry.asset,
                            quantity: entry.quantity
                        });
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

    // returns an array of transactions from the given transaction IDs
    // [
    //     {
    //         "asset": "XAAACOIN",
    //         "quantity": 100000000,
    //         "calling_function": "send",
    //         "block_index": 424000,
    //         "address": "1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j",
    //         "event": "aaaaa",
    //         "direction": "credit",
    //         "divisible": true,
    //         "quantityFloat": 1
    //     }
    // ]
    xcpdClient.findTransactionsById = function (transactionIds) {
        var address = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        if (transactionIds.length > 100) {
            throw new Error("Limited to 100 transaction IDs");
        }
        var query = {
            filters: {
                event: { op: "IN", value: transactionIds }
            }
        };

        // also filter by address
        if (address != null) {
            query.filters.address = address;
        }

        return Promise.all([xcpdClient.call('get_credits', xcpdClient.buildQuery(query)), xcpdClient.call('get_debits', xcpdClient.buildQuery(query))]).then(function (creditsAndDebits) {
            var _creditsAndDebits = _slicedToArray(creditsAndDebits, 2);

            var credits = _creditsAndDebits[0];
            var debits = _creditsAndDebits[1];


            var promises = [];
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                var _loop2 = function _loop2() {
                    var credit = _step2.value;

                    credit.direction = 'credit';
                    promises.push(xcpdClient.isDivisible(credit.asset).then(function (isDivisible) {
                        return applyDivisibleProperties(isDivisible, credit);
                    }));
                };

                for (var _iterator2 = credits[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    _loop2();
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                var _loop3 = function _loop3() {
                    var debit = _step3.value;

                    debit.direction = 'debit';
                    promises.push(xcpdClient.isDivisible(debit.asset).then(function (isDivisible) {
                        return applyDivisibleProperties(isDivisible, debit);
                    }));
                };

                for (var _iterator3 = debits[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    _loop3();
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            return Promise.all(promises);
        });
    };

    // returns an array of matched mempool transactions from the given transaction IDs
    // [
    //    {
    //        "asset": "BITCRYSTALS",
    //        "quantity": 36772088955,
    //        "quantityFloat": 367.72088955,
    //        "source": "1EdBW9ebNqfZtCqEfstLnaAJgGNGmPNniS",
    //        "destination": "1AeqgtHedfA2yVXH6GiKLS2JGkfWfgyTC6",
    //        "tx_hash": "f6eeb2364ac0f2f96bb0021980c384d990d0c7b7fb208d4ddc012ca778c89fa2",
    //        "timestamp": 1471702974,
    //        "category": "sends",
    //        "mempool": true,
    //        "divisible": true
    //    }
    // ]
    xcpdClient.findMempoolTransactionsById = function () {
        var transactionIds = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
        var address = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        if (transactionIds.length > 100) {
            throw new Error("Limited to 100 transaction IDs");
        }

        var query = {};
        if (transactionIds != null) {
            query = {
                filters: {
                    tx_hash: { op: "IN", value: transactionIds }
                }
            };
        }

        return xcpdClient.call('get_mempool', xcpdClient.buildQuery(query)).then(function (mempool_entries) {

            var mempoolTxs = [];
            var promises = [];
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = mempool_entries[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var mempool_entry = _step4.value;

                    var binding = JSON.parse(mempool_entry.bindings);

                    // filter by address if necessary
                    if (address != null) {
                        var found = false;
                        if (binding.source == address || binding.destination == address) {
                            found = true;
                        }
                        if (!found) {
                            continue;
                        }
                    }

                    binding.category = mempool_entry.category;
                    binding.timestamp = mempool_entry.timestamp;
                    binding.mempool = true;

                    promises.push(buildMempoolPropertiesPromise(binding.asset, binding));
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            return Promise.all(promises);
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
                    if (spec !== null && (typeof spec === 'undefined' ? 'undefined' : _typeof(spec)) === 'object') {
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

        var _arr = ['filterop', 'order_by', 'order_dir', 'limit', 'offset'];
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

    function buildMempoolPropertiesPromise(asset, properties) {
        return new Promise(function (resolve) {
            if (asset == null) {
                resolve(properties);
                return;
            } else {
                if (properties.divisible != null) {
                    // use the properties.divisible
                    resolve(applyDivisibleProperties(properties.divisible, properties));
                    return;
                } else {
                    // try to get divisible properties for a previously issued asset
                    xcpdClient.isDivisible(asset).then(function (isDivisible) {
                        resolve(applyDivisibleProperties(isDivisible, properties));
                        return;
                    });
                    return;
                }
            }
        });
    }

    function buildIsDivisible(assetName) {
        return xcpdClient.getAssetInfo(assetName).then(function (assetInfo) {
            if (assetInfo == null) {
                return null;
            }
            return assetInfo.divisible;
        });
    }

    function applyDivisibleProperties(isDivisible, entry) {
        return _extends({}, entry, {
            divisible: isDivisible,
            quantityFloat: isDivisible ? entry.quantity / SATOSHI : entry.quantity
        });
    }

    // ------------------------------------------------------------------------

    return xcpdClient;
};

exports.default = XCPDClient;