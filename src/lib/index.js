import jayson     from 'jayson/promise';
import assetCache from './assetCache';

let XCPDClient = {};

const SATOSHI = 100000000;

XCPDClient.connect = (opts)=>{
    opts = opts || {}

    let clientOpts = {}
    clientOpts.port = opts.port || 4000;
    clientOpts.host = opts.host || 'localhost';
    clientOpts.cacheFile = opts.cacheFile || null;

    let auth = null
    if (opts.username != null && opts.password != null) {
        clientOpts.auth = opts.username+':'+opts.password
    }

    let client = jayson.client.http(clientOpts);

    let useDivisibleCache = false
    let divisibleCache = null
    if (clientOpts.cacheFile != null) {
        useDivisibleCache = true
        divisibleCache = assetCache.connect(clientOpts.cacheFile)
    }

    // ------------------------------------------------------------------------
    
    let xcpdClient = {};
    
    xcpdClient.getAssetInfo = (assetName)=>{
        return xcpdClient.call('get_asset_info', {assets: [assetName]}).then((assets)=>{
            return assets[0];
        });
    }

    // returns a Promise with isDivisible
    xcpdClient.isDivisible = (assetName)=>{
        if (!useDivisibleCache) {
            return buildIsDivisible(assetName);
        }

        return divisibleCache.isDivisible(assetName)
        .then((isDivisible)=>{
            if (isDivisible === null) {
                return buildIsDivisible(assetName)
                .then((isDivisible)=>{
                    divisibleCache.put(assetName, {divisible: isDivisible})
                    return isDivisible
                })
            } else {
                return isDivisible;
            }
        })
    }

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
    xcpdClient.getBalances = (address, querySpec={})=>{
        // $result = $client->execute('get_balances', array('filters' => array('field' => 'address', 'op' => '==', 'value' => '1NFeBp9s5aQ1iZ26uWyiK2AYUXHxs7bFmB')));

        let query = {
            filters: {address: address},
            ...querySpec
        };
        return xcpdClient.call('get_balances', xcpdClient.buildQuery(query)).then((result)=>{
            let isDivisiblePromises = [];
            // console.log('result', result);
            for (let entry of result) {
                isDivisiblePromises.push(
                    xcpdClient.isDivisible(entry.asset).then((isDivisible)=>{
                        return {
                            asset:         entry.asset,
                            quantity:      entry.quantity,
                            divisible:     isDivisible,
                            quantityFloat: (isDivisible ? (entry.quantity / SATOSHI) : entry.quantity)
                        }
                    })
                )
            }

            return Promise.all(isDivisiblePromises);
        });
    }

    xcpdClient.buildQuery = (querySpec)=>{
        let query = {};

        let filters = [];
        if (querySpec.filters != null && typeof querySpec.filters === 'object') {
            for (let field in querySpec.filters) {
                if (querySpec.filters.hasOwnProperty(field)) {
                    let spec = querySpec.filters[field]
                    let value;
                    let op = '==';
                    if (field !== null && typeof field === 'object') {
                        op = spec.op;
                        value = spec.value;

                    } else {
                        value = spec;
                    }

                    filters.push({
                        field: field,
                        op:    op,
                        value, value,
                    })
                } 
            }
        }
        query.filters = filters;

        for(let allowedKey of ['filterop', 'order_by', 'order_dir']) {
            if (querySpec[allowedKey] != null) {
                query[allowedKey] = querySpec[allowedKey];
            }
        }

        return query;
    }

    xcpdClient.close = ()=>{
        if (useDivisibleCache) {
            return divisibleCache.close()
        }
        return new Promise((resolve)=>{ resolve(true); });
    }

    // ------------------------------------------------------------------------
    
    xcpdClient.getDivisibleCache = ()=>{
        return divisibleCache
    }

    xcpdClient.call = (method, args)=>{
        return client.request(method, args).then(xcpdClient.parseResponse);
    }

    xcpdClient.parseResponse = (rawResponseData)=>{
        return rawResponseData.result;
    };

    // ------------------------------------------------------------------------
    
    function buildIsDivisible(assetName) {
        return xcpdClient.getAssetInfo(assetName)
        .then((assetInfo)=>{
            if (assetInfo == null) {
                return null;
            }
            return assetInfo.divisible;
        })
    }

    // ------------------------------------------------------------------------

    return xcpdClient;
}



export default XCPDClient;