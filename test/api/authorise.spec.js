import should from 'should';
import axios from 'axios';
import CONSTANTS from './constants';
import UserData from './user_data';

const userDataObj = new UserData();
const END_POINT = `${CONSTANTS.API_SERVER}/auth`;

const AUTHORISE_PAYLOAD = {
  app: {
    name: 'MaidSafe test',
    vendor: 'maidsafe',
    version: '1.0.2',
    id: 'maidsafe.com'
  },
  permissions: [
    'SAFE_DRIVE_ACCESS'

  ]
};

export const authoriseApp = async() => {
  const response = await axios.post(END_POINT, AUTHORISE_PAYLOAD, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  userDataObj.setAuthToken(`Bearer ${response.data.token}`);
  should(response.status).equal(200);
};

export const denyAuthorisation = async() => {
  try {
    await axios.post(END_POINT, AUTHORISE_PAYLOAD, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    should(e.response.status).equal(401);
  }
};

export const checkAppAuthorised = async() => {
  try {
    const response = await axios.get(END_POINT, {
      headers: {
        Authorization: userDataObj.authToken
      }
    });
    should(response.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const revokeApp = async() => {
  const headers = {
    headers: {
      Authorization: userDataObj.authToken
    }
  };
  try {
    const revokeResponse = await axios.delete(END_POINT, headers);
    should(revokeResponse.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
  try {
    await axios.get(END_POINT, headers);
  } catch (e) {
    should(e.response.status).equal(401);
  }
};
