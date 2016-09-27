import should from 'should';
import axios from 'axios';
import CONSTANTS from './constants';

export const checkHealth = async() => {
  const health = await axios(`${CONSTANTS.API_SERVER}/health`);
  should(health.status).equal(200);
};

export const getpacFile = async() => {

};
