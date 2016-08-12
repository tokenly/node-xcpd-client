'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _levelup = require('levelup');

var _levelup2 = _interopRequireDefault(_levelup);

var _leveldown = require('leveldown');

var _leveldown2 = _interopRequireDefault(_leveldown);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cache = {};

cache.connect = function (filepath) {
    var connection = {};

    var db = (0, _levelup2.default)(filepath, {
        valueEncoding: 'json'
    });

    connection.get = function (assetName) {
        checkDb();
        return new Promise(function (resolve, reject) {
            db.get(assetName, function (err, value) {
                if (err && err.notFound) {
                    return resolve(null);
                }
                if (err) {
                    return reject(err);
                }

                resolve(value);
            });
        });
    };

    connection.isDivisible = function (assetName) {
        return connection.get(assetName).then(function (info) {
            if (info == null) {
                return null;
            }

            return info.divisible;
        });
    };

    connection.put = function (assetName, info) {
        checkDb();
        return new Promise(function (resolve, reject) {
            db.put(assetName, info, function (err) {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    };

    connection.close = function () {
        return new Promise(function (resolve, reject) {
            db.close(function (err) {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    };

    function checkDb() {
        if (db == null) {
            throw new Error("asset cache db not initiallized");
        }
    }

    return connection;
};

cache.destroy = function (filepath) {
    return new Promise(function (resolve, reject) {
        _leveldown2.default.destroy(filepath, function (err) {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
};

exports.default = cache;