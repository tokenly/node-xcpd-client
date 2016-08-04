import should from 'should';
import sinon from 'sinon';
import XCPDClient from '..';

describe('The xcpd client', () => {
    it('should call get_asset_info', () => {
        let client = XCPDClient.connect();
        let stub = sinon.stub(client, 'call', emptyPromise);
        client.getAssetInfo('TOKENLY');
        sinon.assert.calledWith(stub, 'get_asset_info', {assets: ['TOKENLY']});
    });
    it('should call get_balances by address', () => {
        let client = XCPDClient.connect();
        let stub = sinon.stub(client, 'call', emptyPromise);
        client.getBalances('1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j');
        sinon.assert.calledWith(stub, 'get_balances', {filters: [{field: 'address', op: '==', value: '1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j'}]});
    });
    it('should call get_balances by address with advanced query', () => {
        let client = XCPDClient.connect();
        let stub = sinon.stub(client, 'call', emptyPromise);
        client.getBalances('1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j', {order_dir: "asc", order_by: "foo", filterop: "OR", ignoreme: "BAR"});
        sinon.assert.calledWith(stub, 'get_balances', {
            filters: [{field: 'address', op: '==', value: '1AAAA1111xxxxxxxxxxxxxxxxxxy43CZ9j'}],
            order_dir: "asc",
            order_by: "foo",
            filterop: "OR",
        });
    });
});

function emptyPromise(method, args) {
    return new Promise((accept, reject)=>{
    });
}