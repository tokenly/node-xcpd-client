import should      from 'should';
import sinon       from 'sinon';
import XCPDClient  from '..';
import assetCache  from '../lib/assetCache';
import testHelpers from './helpers';

describe('The xcpd client', () => {

    it('loads mempool transactions by transaction ids and filters by address', (done) => {
        let TEST_DB_FILE = __dirname+'/../data/test.db';
        before(function() {
            return client.close().then(()=>{
                assetCache.destroy(TEST_DB_FILE)
            });
        });
        // ---------------------------------


        let client = XCPDClient.connect({cacheFile: TEST_DB_FILE});
        let stubAssetInfo = sinon.stub(client, 'getAssetInfo', testHelpers.getAssetInfoPromiseWithMap({XAAACOIN: true, XBBBCOIN: true, XCCCCOIN: false}));
        let stubCall = sinon.stub(client, 'call', testHelpers.returnGetMempoolCall());

        client.findMempoolTransactionsById([testHelpers.makeTxId(1)])
        .then((foundMempoolTxs)=>{
            foundMempoolTxs.length.should.eql(1)

            foundMempoolTxs[0].asset.should.eql('XAAACOIN')
            foundMempoolTxs[0].quantity.should.eql(250 * testHelpers.SATOSHI)
            foundMempoolTxs[0].divisible.should.eql(true)
            foundMempoolTxs[0].quantityFloat.should.eql(250)
            foundMempoolTxs[0].source.should.eql('1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j')
            foundMempoolTxs[0].destination.should.eql('1AAAA2222xxxxxxxxxxxxxxxxxxy4pQ3tU')
        })

        // ----------
        .then(()=>{
            return client.findMempoolTransactionsById([testHelpers.makeTxId(1), testHelpers.makeTxId(4)])
        })
        .then((foundMempoolTxs)=>{
            foundMempoolTxs.length.should.eql(2)

            foundMempoolTxs[0].asset.should.eql('XAAACOIN')
            foundMempoolTxs[0].quantity.should.eql(250 * testHelpers.SATOSHI)
            foundMempoolTxs[0].divisible.should.eql(true)
            foundMempoolTxs[0].quantityFloat.should.eql(250)
            foundMempoolTxs[0].source.should.eql('1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j')
            foundMempoolTxs[0].destination.should.eql('1AAAA2222xxxxxxxxxxxxxxxxxxy4pQ3tU')
            foundMempoolTxs[0].category.should.eql('sends')
            foundMempoolTxs[0].mempool.should.eql(true)

            foundMempoolTxs[1].asset.should.eql('XCCCCOIN')
            foundMempoolTxs[1].quantity.should.eql(20)
            foundMempoolTxs[1].divisible.should.eql(false)
            foundMempoolTxs[1].quantityFloat.should.eql(20)
            foundMempoolTxs[1].source.should.eql('1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j')
            foundMempoolTxs[1].destination.should.eql('1AAAA2222xxxxxxxxxxxxxxxxxxy4pQ3tU')
            foundMempoolTxs[1].category.should.eql('sends')
            foundMempoolTxs[1].mempool.should.eql(true)
        })

        // ----------
        .then(()=>{
            return client.findMempoolTransactionsById([testHelpers.makeTxId(5)])
        })
        .then((foundMempoolTxs)=>{
            foundMempoolTxs.length.should.eql(1)

            foundMempoolTxs[0].category.should.eql('orders')
            foundMempoolTxs[0].mempool.should.eql(true)
            should.not.exist(foundMempoolTxs[0].asset)
            should.not.exist(foundMempoolTxs[0].divisible)
            should.not.exist(foundMempoolTxs[0].quantityFloat)
            should.not.exist(foundMempoolTxs[0].quantity)

        })

        // ----------
        .then(()=>{
            return client.findMempoolTransactionsById(testHelpers.makeTxIds([1,2,3,4,5]), '1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j')
        })
        .then((foundMempoolTxs)=>{
            foundMempoolTxs.length.should.eql(4)
        })

        // ----------
        .then(()=>{
            return client.findMempoolTransactionsById(testHelpers.makeTxIds([1,2,3,4,5]), '1AAAA2222xxxxxxxxxxxxxxxxxxy4pQ3tU')
        })
        .then((foundMempoolTxs)=>{
            foundMempoolTxs.length.should.eql(3)
        })

        // ----------
        .then(()=>{
            return client.findMempoolTransactionsById(testHelpers.makeTxIds([1,2,3,4,5]), '1AAAA3333xxxxxxxxxxxxxxxxxxxsTtS6v')
        })
        .then((foundMempoolTxs)=>{
            foundMempoolTxs.length.should.eql(1)
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


