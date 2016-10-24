import should from 'should';
import mockApp from '../mock_app';

describe('Server status', () => {
  it('Should have started', (cb) => {
    mockApp.axios.get('health')
      .should.be.fulfilled()
      .then((res) => {
        should(res.status).be.equal(200);
        cb();
      })
      .catch((err) => cb(err));
  });
});
