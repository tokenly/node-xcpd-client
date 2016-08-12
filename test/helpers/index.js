let helpers = {}

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
    for (let txHash in overrideEntriesMap) {
        fullEntriesMap[txHash] = {
            ...prototypeEntry,
            event: txHash,
            ...overrideEntriesMap[txHash]
        }
    }

    return fullEntriesMap;
}


export default helpers