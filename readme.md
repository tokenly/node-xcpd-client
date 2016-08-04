# A Counterparty Server API client for node

## Usage Example

```node
var XCPDClient = require('node-xcpd-client');

var client = XCPDClient.connect({
    host:     'localhost',
    port:     4000,
    username: 'rpc',
    password: 'MyP@ssW0Rd'
});

var address = '1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j';
client.getBalances(address).then(function(balances) {
    console.log('balances', balances);

    // {
    //      TOKENLY: 900000000,
    //      LTBCOIN: 12345647890
    // }

}, function (err) {
    console.error('there was an error: ', err);
});
```

