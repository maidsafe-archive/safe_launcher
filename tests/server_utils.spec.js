import should from 'should';
import {
  formatResponse
} from '../app/server/utils';

describe('Server utils test', function() {
  it('Should be able to format JSON response', function() {
    var sampleInput = {
      "info": {
        "name": "home",
        "is_private": true,
        "is_versioned": false,
        "user_metadata": "",
        "creation_time_sec": 1455025124,
        "creation_time_nsec": 708795700,
        "modification_time_sec": 1455087478,
        "modification_time_nsec": 280748600
      },
      "files": [],
      "sub_directories": [{
        "name": "test",
        "is_private": true,
        "is_versioned": false,
        "user_metadata": "",
        "creation_time_sec": 1455087478,
        "creation_time_nsec": 280748600,
        "modification_time_sec": 1455087478,
        "modification_time_nsec": 280748600
      }]
    };
    var expectedOutput = {
      "info": {
        "name": "home",
        "isPrivate": true,
        "isVersioned": false,
        "createdOn": 1455025124708,
        "modifiedOn": 1455087478280,
        "metadata": ""
      },
      "files": [],
      "subDirectories": [{
        "name": "test",
        "isPrivate": true,
        "isVersioned": false,
        "createdOn": 1455087478280,
        "modifiedOn": 1455087478280,
        "metadata": ""
      }]
    };
    formatResponse(sampleInput).should.be.eql(expectedOutput);
  });
})
