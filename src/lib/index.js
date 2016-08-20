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
                        return applyDivisibleProperties(isDivisible, {
                            asset:         entry.asset,
                            quantity:      entry.quantity,
                        })
                    })
                )
            }

            return Promise.all(isDivisiblePromises);
        });
    }

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
    xcpdClient.findTransactionsById = (transactionIds, address=null)=>{
        if (transactionIds.length > 100) {
            throw new Error("Limited to 100 transaction IDs")
        }
        let query = {
            filters: {
                event: {op: "IN", value: transactionIds}
            },
        };

        // also filter by address
        if (address != null) {
            query.filters.address = address
        }

        return Promise.all([
            xcpdClient.call('get_credits', xcpdClient.buildQuery(query)),
            xcpdClient.call('get_debits', xcpdClient.buildQuery(query))            
        ]).then((creditsAndDebits)=>{
            let [credits, debits] = creditsAndDebits;

            let promises = []
            for (let credit of credits) {
                credit.direction = 'credit'
                promises.push(
                    xcpdClient.isDivisible(credit.asset).then((isDivisible)=>{
                        return applyDivisibleProperties(isDivisible, credit);
                    })
                );
            }
            for (let debit of debits) {
                debit.direction = 'debit'
                promises.push(
                    xcpdClient.isDivisible(debit.asset).then((isDivisible)=>{
                        return applyDivisibleProperties(isDivisible, debit);
                    })
                );
            }

            return Promise.all(promises)
        });

    }


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
    //        "divisible": true
    //    }
    // ]
    xcpdClient.findMempoolTransactionsById = (transactionIds=null, address=null)=>{
        if (transactionIds.length > 100) {
            throw new Error("Limited to 100 transaction IDs")
        }

        let query = {};
        if (transactionIds != null) {
            query = {
                filters: {
                    tx_hash: {op: "IN", value: transactionIds}
                },
            };
        }

        return xcpdClient.call('get_mempool', xcpdClient.buildQuery(query))
        .then((mempool_entries)=>{

            let mempoolTxs = [];
            let isDivisiblePromises = [];
            for (let mempool_entry of mempool_entries) {
                let binding = JSON.parse(mempool_entry.bindings)

                // filter by address if necessary
                if (address != null) {
                    let found = false;
                    if (binding.source == address || binding.destination == address) {
                        found = true;
                    }
                    if (!found) { continue; }
                }

                binding.category = mempool_entry.category
                binding.timestamp = mempool_entry.timestamp
                binding.mempool = true

                isDivisiblePromises.push(buildDivisiblePropertiesPromise(binding.asset, binding))
            }

            return Promise.all(isDivisiblePromises)
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
                    if (spec !== null && typeof spec === 'object') {
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

        for(let allowedKey of ['filterop', 'order_by', 'order_dir', 'limit', 'offset']) {
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

    function buildDivisiblePropertiesPromise(asset, properties) {
        if (asset == null) {
            return new Promise((resolve)=>{ resolve(properties); });
        } else {
            return xcpdClient.isDivisible(asset).then((isDivisible)=>{
                return applyDivisibleProperties(isDivisible, properties)
            })
        }

    }
    
    function buildIsDivisible(assetName) {
        return xcpdClient.getAssetInfo(assetName)
        .then((assetInfo)=>{
            if (assetInfo == null) {
                return null;
            }
            return assetInfo.divisible;
        })
    }

    function applyDivisibleProperties(isDivisible, entry) {
        return {
            ...entry,
            divisible:     isDivisible,
            quantityFloat: (isDivisible ? (entry.quantity / SATOSHI) : entry.quantity)
        }
    }

    // ------------------------------------------------------------------------

    return xcpdClient;
}



export default XCPDClient;