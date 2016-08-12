import should      from 'should';
import sinon       from 'sinon';
import XCPDClient  from '..';
import assetCache  from '../lib/assetCache';
import testHelpers from './helpers';

describe('The xcpd divisible cache', () => {

    it('works for divisible asset', (done) => {
        let TEST_DB_FILE = __dirname+'/../data/test.db';
        let testAssetName = 'FOOCOIN'+(Date.now());

        let client = XCPDClient.connect({cacheFile: TEST_DB_FILE});
        let stub = sinon.stub(client, 'getAssetInfo', testHelpers.getAssetInfoPromise(true));

        client.isDivisible(testAssetName)

        // check initial lookup
        .then((isDivisible)=>{
            isDivisible.should.be.true()
            sinon.assert.calledWith(stub, testAssetName);
        })

        // verify cached data was stored
        .then(()=>{
            return client.getDivisibleCache().get(testAssetName).then((cachedData)=>{
                cachedData.divisible.should.be.true()
            })
        })

        // lookup again
        .then(()=>{
            return client.isDivisible(testAssetName)
        })

        // check that stub was not called again
        .then((isDivisible)=>{
            isDivisible.should.be.true()

            // getAssetInfo was only called once
            sinon.assert.calledOnce(stub);
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

    it('works for indivisible asset', (done) => {
        let TEST_DB_FILE = __dirname+'/../data/test.db';
        let testAssetName = 'FOOCOIN'+(Date.now());

        let client = XCPDClient.connect({cacheFile: TEST_DB_FILE});
        let stub = sinon.stub(client, 'getAssetInfo', testHelpers.getAssetInfoPromise(false));

        client.isDivisible(testAssetName)

        // check initial lookup
        .then((isDivisible)=>{
            isDivisible.should.be.false()
            sinon.assert.calledWith(stub, testAssetName);
        })

        // verify cached data was stored
        .then(()=>{
            return client.getDivisibleCache().get(testAssetName).then((cachedData)=>{
                cachedData.divisible.should.be.false()
            })
        })

        // lookup again
        .then(()=>{
            return client.isDivisible(testAssetName)
        })

        // check that stub was not called again
        .then((isDivisible)=>{
            isDivisible.should.be.false()

            // getAssetInfo was only called once
            sinon.assert.calledOnce(stub);
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



