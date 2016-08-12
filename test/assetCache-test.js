import should from 'should';
import sinon from 'sinon';
import XCPDClient from '..';
import assetCache from '../lib/assetCache';

describe('The asset cache', () => {
    it('stores and reads data', (done) => {
        let TEST_DB = __dirname+'/../data/test.db';
        let connection = assetCache.connect(TEST_DB)
        
        connection.put('foo', {bar: 1})
        .then(()=>{
            return connection.get('foo')
        })
        .then((loadedValue)=>{
            loadedValue.should.eql({bar: 1})
            connection.close().then(()=>{ done() });
        }).catch((err)=>{
            done(err);
        })
        

        after(function() {
            assetCache.destroy(TEST_DB)
        });

    });

});

