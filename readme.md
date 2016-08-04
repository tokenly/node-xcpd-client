# A Counterparty Server API client for node

## Usage Example

```node
var XCPDClient = require('node-xcpd-client');

var client = XCPDCLient.connect({
    host:     'localhost',
    port:     4000,
    username: 'rpc',
    password: 'MyP@ssW0Rd'
});

client.getBalances(address).then((balances)=>{
    console.log('balances', balances);

    // {
    //      TOKENLY: 900000000,
    //      LTBCOIN: 12345647890
    // }

}, (err)=>{
    console.error('there was an error: ', err);
});
```

