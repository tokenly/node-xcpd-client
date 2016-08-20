#!/usr/bin/env node

const path = require('path');

import buildClientFromCLI from './lib/buildClientFromCLI';

if (process.argv[2] == null || process.argv[2] == '-h') {
    process.stdout.write("Usage: "+path.basename(process.argv[1])+" <txid1,txid2> [<address>] [<from-mempool>]"+"\n");
    process.exit(0);
}

let client = buildClientFromCLI();

// a comma separated list if TxIDs
//    7833ac59a8ce06f76a82fb46cb68fec8cf0b62617b6663c50f03f20a7b9e25e3,cac7b602116d5a2d89105243155882213d23d77742b2bcab1ec988eed46ebdcb,5746514ab5934afdb4e20ad81ffc8d9b7881549722979c081841ec2ac252b3a9,278f8bf8b3ecfee1cd6c064c06efed31f2e197e0b6e30ad71f24503aca4acc12
let ids = process.argv[2].split(',');
let address = process.argv[3] || null

let mempool = !!process.argv[4]
if (address == null || address.length < 30) {
    address = null
    mempool = !!process.argv[3]
}

process.stdout.write("Fetching "+(mempool ? '(mempool)' : '(live)')+" transaction for IDs: "+JSON.stringify(ids, null, 4)+"\n");
console.log('address', address);

let promise
if (mempool) {
    promise = client.findMempoolTransactionsById(ids, address)
} else {
    promise = client.findTransactionsById(ids, address)
}

promise.then((result)=>{
    process.stdout.write(""+JSON.stringify(result,null,4)+"\n");
}, (err)=>{
    console.error('there was an error:', err);
});

