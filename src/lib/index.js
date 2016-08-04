import jayson from 'jayson/promise';

let XCPDClient = {};


XCPDClient.connect = (opts)=>{
    opts = opts || {}

    let clientOpts = {}
    clientOpts.port = opts.port || 4000;
    clientOpts.host = opts.host || 'localhost';

    let auth = null
    if (opts.username != null && opts.password != null) {
        clientOpts.auth = opts.username+':'+opts.password
    }

    let client = jayson.client.http(clientOpts);

    // ------------------------------------------------------------------------
    
    let xcpdClient = {};
    
    xcpdClient.getAssetInfo = (assetName)=>{
        return xcpdClient.call('get_asset_info', {assets: [assetName]}).then((assets)=>{
            return assets[0];
        });
    }

    // returns balances for an address in the form of
    // {
    //      TOKENLY: 900000000,
    //      LTBCOIN: 12345647890
    // }
    // All balances are integers.  Divisible assets should be divided by 100000000 to determine the balance.
    xcpdClient.getBalances = (address, querySpec={})=>{
        // $result = $client->execute('get_balances', array('filters' => array('field' => 'address', 'op' => '==', 'value' => '1NFeBp9s5aQ1iZ26uWyiK2AYUXHxs7bFmB')));

        let query = {
            filters: {address: address},
            ...querySpec,
        };
        return xcpdClient.call('get_balances', xcpdClient.buildQuery(query)).then((result)=>{
            // console.log('result', result);
            let balances = {}
            for (let entry of result) {
                balances[entry.asset] = entry.quantity;
            }
            return balances;
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

    // ------------------------------------------------------------------------
    
    xcpdClient.call = (method, args)=>{
        return client.request(method, args).then(xcpdClient.parseResponse);
    }

    xcpdClient.parseResponse = (rawResponseData)=>{
        return rawResponseData.result;
    };

    return xcpdClient;
}



export default XCPDClient;