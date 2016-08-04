import should from 'should';

describe('The node enviroment', () => {
    it('should think 1 is true', () => {
        let a = 1;
        a.should.be.true;
    });
});

