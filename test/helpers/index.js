let helpers = {}

const SATOSHI = helpers.SATOSHI = 100000000;

helpers.cacheDBFilename = ()=>{ return __dirname+'/../../data/test.db'; }

helpers.emptyPromise = function(method, args) {
    return new Promise((resolve, reject)=>{});
}
helpers.getAssetInfoPromise = function(shouldBeDivisible=true) {
    return helpers.getAssetInfoPromiseWithMap({default: shouldBeDivisible});
}
helpers.getAssetInfoPromiseWithMap = function(map={}) {
    return (assetName)=>{
        return new Promise((resolve, reject)=>{
            let shouldBeDivisible = true;
            if (map[assetName] != null) {
                shouldBeDivisible = map[assetName];
            } else if (map.default != null) {
                shouldBeDivisible = map.default;
            }


            setTimeout(()=>{
                resolve({
                    name:      assetName,
                    divisible: shouldBeDivisible
                })
            }, 1);
        });
    }
}

helpers.returnAssetBalancesCall = function(balancesMap={}) {
    return (method, args)=>{
        return new Promise((resolve, reject)=>{
            let entries = [];
            for (let asset in balancesMap) {
                entries.push({
                    asset:    asset,
                    quantity: balancesMap[asset],
                });
            }
            resolve(entries);
        });
    }
}

helpers.returnCreditsAndDebitsCall = function(creditsAndDebitsMap={}) {
    let credits = makeCreditOrDebitEntries(creditsAndDebitsMap.credits || {})
    let debits  = makeCreditOrDebitEntries(creditsAndDebitsMap.debits  || {})

    return (method, args)=>{
        return new Promise((resolve, reject)=>{
            let entries = [];
            let txIds = args.filters[0].value
            // console.log(''+method+' txIds', txIds);

            if (method == 'get_credits') {
                for (let txId of txIds) {
                    if (credits[txId] != null) {
                        entries.push(credits[txId]);
                    }
                }
            }
            if (method == 'get_debits') {
                for (let txId of txIds) {
                    if (debits[txId] != null) {
                        entries.push(debits[txId]);
                    }
                }
            }

            resolve(entries);
        });
    }
}

helpers.returnGetMempoolCall = function() {
    return (method, args)=>{
        return new Promise((resolve, reject)=>{
            let i = 0;
            let entries = [
                newMempoolEntry(++i, {asset: "XAAACOIN", quantity: 250 * SATOSHI}),
                newMempoolEntry(++i, {asset: "XBBBCOIN", quantity:  50 * SATOSHI}),
                newMempoolEntry(++i, {source: "1AAAA3333xxxxxxxxxxxxxxxxxxxsTtS6v", destination: "1AAAA4444xxxxxxxxxxxxxxxxxxxxjbqeD"}),
                newMempoolEntry(++i, {asset: "XCCCCOIN", quantity: 20}),
                newMempoolEntry(++i, {
                    "expiration": 1000,
                    "expire_index": 10000999,
                    "fee_provided": 20000,
                    "fee_provided_remaining": 20000,
                    "fee_required": 0,
                    "fee_required_remaining": 0,
                    "get_asset": "XCP",
                    "get_quantity": 2000000000,
                    "get_remaining": 2000000000,
                    "give_asset": "XAAACOIN",
                    "give_quantity": 1,
                    "give_remaining": 1,
                    "source": "1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j",
                }, {category: "orders"}, true),
            ];

            if (args && args.filters && args.filters[0].field == "tx_hash") {
                let filtered = []
                let txIdsQueryMap = {}
                for (let value of args.filters[0].value) {
                    txIdsQueryMap[value] = true;
                }
                for (let entry of entries) {
                    if (txIdsQueryMap[entry.tx_hash]) {
                        filtered.push(entry);
                    }
                }
                resolve(filtered);
                return;
            }

            resolve(entries);
        });
    }
};

let makeTxId = helpers.makeTxId = (i) => {
    return '000000000000000000000000000000000000000000000000000000000000'+pad(i, 4);
}

helpers.makeTxIds = (numbers) => {
    let out = [];
    for (let number of numbers) {
        out.push(makeTxId(number))
    }
    return out;
}


// ------------------------------------------------------------------------

function newMempoolEntry(i, bindingOverrides={}, entryOverrides={}, clearBinding=false) {
    let txid = makeTxId(i);

    let bindings;

    if (clearBinding) {
        bindings = {
            tx_hash:     txid,
            ...bindingOverrides
        };
    } else {
        bindings = {
            asset:       "XAAACOIN",
            source:      "1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j",
            destination: "1AAAA2222xxxxxxxxxxxxxxxxxxy4pQ3tU",
            quantity:    250 * SATOSHI,
            tx_hash:     txid,
            ...bindingOverrides,
        }
    }

    return {
        tx_hash: bindings.tx_hash,
        timestamp: Math.round(new Date().getTime()/1000) - 100 + i,
        command: "insert",
        category: "sends",
        bindings: JSON.stringify(bindings),
        ...entryOverrides,
    }
}
function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function makeCreditOrDebitEntries(overrideEntriesMap) {
    let fullEntriesMap = {};
    let prototypeEntry = {
        asset:            "FOOCOIN",
        quantity:         100000000,
        calling_function: "send",
        block_index:      424000,
        address:          "1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j",
        event:            "xxxx"
    }
    for (let txid in overrideEntriesMap) {
        fullEntriesMap[txid] = {
            ...prototypeEntry,
            event: txid,
            ...overrideEntriesMap[txid]
        }
    }

    return fullEntriesMap;
}


export default helpers