import should from 'should';
import sinon from 'sinon';
import XCPDClient from '..';
import assetCache from '../lib/assetCache';
import testHelpers from './helpers';

describe('The xcpd client', () => {

    it('composes quantities for divisible and indivisible assets', (done) => {
        let TEST_DB_FILE = __dirname+'/../data/test.db';
        before(function() {
            return client.close().then(()=>{
                assetCache.destroy(TEST_DB_FILE)
            });
        });
        // ---------------------------------


        let testAssetName = 'DIVISIBLECOIN';

        let client = XCPDClient.connect({cacheFile: TEST_DB_FILE});
        let stubAssetInfo = sinon.stub(client, 'getAssetInfo', testHelpers.getAssetInfoPromiseWithMap({'DIVISIBLECOIN': true, 'INDIVISIBLECOIN': false}));
        let stubCall = sinon.stub(client, 'call', testHelpers.returnAssetBalancesCall({'DIVISIBLECOIN': 500000000, 'INDIVISIBLECOIN': 9}));

        client.getBalances('1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j')

        .then((balanceEntries)=>{
            balanceEntries[0].asset.should.eql('DIVISIBLECOIN')
            balanceEntries[0].quantity.should.eql(500000000)
            balanceEntries[0].quantityFloat.should.eql(5)

            balanceEntries[1].asset.should.eql('INDIVISIBLECOIN')
            balanceEntries[1].quantity.should.eql(9)
            balanceEntries[1].quantityFloat.should.eql(9)
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



