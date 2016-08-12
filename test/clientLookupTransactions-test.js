import should from 'should';
import sinon from 'sinon';
import XCPDClient from '..';
import assetCache from '../lib/assetCache';
import testHelpers from './helpers';

describe('The xcpd client', () => {

    it('looks up credits and debits by transaction ids', (done) => {
        let TEST_DB_FILE = __dirname+'/../data/test.db';
        before(function() {
            return client.close().then(()=>{
                assetCache.destroy(TEST_DB_FILE)
            });
        });
        // ---------------------------------


        let testAssetName = 'DIVISIBLECOIN';

        let client = XCPDClient.connect({cacheFile: TEST_DB_FILE});
        let stubAssetInfo = sinon.stub(client, 'getAssetInfo', testHelpers.getAssetInfoPromiseWithMap({XAAACOIN: true, XBBBCOIN: true, XCCCCOIN: false}));
        let stubCall = sinon.stub(client, 'call', testHelpers.returnCreditsAndDebitsCall({
            credits: {
                aaaaa: {
                    asset: "XAAACOIN",
                    quantity: 100000000
                },
            },
            debits: {
                bbbbb: {
                    asset: "XBBBCOIN",
                    quantity: 500000000
                },
                ccccc: {
                    asset: "XCCCCOIN",
                    quantity: 9
                },
            }
        }));

        client.findTransactionsById(['aaaaa','bbbbb','ccccc'], '1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j')

        .then((transactionEntries)=>{
            // console.log('transactionEntries '+JSON.stringify(transactionEntries, null, 4));
            transactionEntries[0].asset.should.eql('XAAACOIN')
            transactionEntries[0].quantity.should.eql(100000000)
            transactionEntries[0].quantityFloat.should.eql(1)
            transactionEntries[0].divisible.should.be.true()

            transactionEntries[1].asset.should.eql('XBBBCOIN')
            transactionEntries[1].quantity.should.eql(500000000)
            transactionEntries[1].quantityFloat.should.eql(5)

            transactionEntries[2].asset.should.eql('XCCCCOIN')
            transactionEntries[2].quantity.should.eql(9)
            transactionEntries[2].quantityFloat.should.eql(9)
            transactionEntries[2].divisible.should.be.false()
        })

        .then(()=>{
            return client.close().then(done);
        })

        .catch((err)=>{
            done(err);
        })


        // ---------------------------------
        after(function() {
            return client.close().then(()=>{
                assetCache.destroy(TEST_DB_FILE)
            });
        });
    });


});

/*
    {
        "asset": "LTBCOIN",
        "quantity": 21263099827168,
        "calling_function": "send",
        "block_index": 424186,
        "address": "1MCEtBB5X4ercRsvq2GmgysZ9ZDsqj8Xh7",
        "event": "68041ea527cbd3e8dc3b599a0fe038a83b22c7fbcfd8b28ccb9ddc5332a03cb7"
    },
    {
        "asset": "LTBCOIN",
        "quantity": 10906739109,
        "calling_function": "send",
        "block_index": 424189,
        "address": "1MCEtBB5X4ercRsvq2GmgysZ9ZDsqj8Xh7",
        "event": "c469a4e3c8e776eba7834a8d9522483dbfd90dcb4758145d3e6f22259f471ac9"
    }
]

 */



