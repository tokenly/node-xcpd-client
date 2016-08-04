#!/usr/bin/env node

import buildClientFromCLI from './lib/buildClientFromCLI';

let client = buildClientFromCLI();

let address = process.argv[2];

process.stdout.write("Fetching asset balances for "+address+"...\n");
client.getBalances(address).then((result)=>{
    process.stdout.write(""+JSON.stringify(result,null,4)+"\n");
}, (err)=>{
    console.error('there was an error:', err);
});

