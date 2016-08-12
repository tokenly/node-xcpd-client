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



export default helpers