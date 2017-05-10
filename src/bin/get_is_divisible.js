#!/usr/bin/env node

import buildClientFromCLI from './lib/buildClientFromCLI';

let client = buildClientFromCLI();

let assetName = process.argv[2];

process.stdout.write("Fetching isDivisible for "+assetName+"...\n");
client.isDivisible(assetName).then((result)=>{
    process.stdout.write(""+JSON.stringify(result,null,4)+"\n");
}, (err)=>{
    console.error('there was an error:', err);
});

