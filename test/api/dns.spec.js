import should from 'should';
import axios from 'axios';
import CONSTANTS from './constants';
import * as nfs from './nfs.spec';
import UserData from './user_data';

const userDataObj = new UserData();
const END_POINT = `${CONSTANTS.API_SERVER}/dns`;
const LONG_NAME = 'testdns';
const SERVICE_NAME = 'testservice';

const getHeaders = () => ({
  headers: {
    'content-type': 'application/json',
    Authorization: userDataObj.authToken
  }
});

export const registerDns = async(longName, serviceName, dirPath) => {
  const payload = {
    longName: longName || LONG_NAME,
    serviceName: serviceName || SERVICE_NAME,
    serviceHomeDirPath: dirPath,
    rootPath: 'APP'
  };
  return await axios.post(END_POINT, payload, getHeaders());
};

export const createLongName = async(longName) => {
  const dnsLongName = longName || LONG_NAME;
  const URL = `${END_POINT}/${dnsLongName}`;
  return await axios.post(URL, {}, getHeaders());
};

export const deleteLongName = async(longName) => {
  const dnsLongName = longName || LONG_NAME;
  const URL = `${END_POINT}/${dnsLongName}`;
  return await axios.delete(URL, getHeaders());
};

export const addService = async(longName, serviceName, dirPath) => {
  const payload = {
    longName: longName || LONG_NAME,
    serviceName: serviceName || SERVICE_NAME,
    serviceHomeDirPath: dirPath,
    rootPath: 'APP'
  };
  return await axios.put(END_POINT, payload, getHeaders());
};

export const deleteServiceName = async(longName, serviceName) => {
  const dnsLongName = longName || LONG_NAME;
  const dnsServieName = serviceName || SERVICE_NAME;
  const URL = `${END_POINT}/${dnsServieName}/${dnsLongName}`;
  return await axios.delete(URL, getHeaders());
};

export const getHomeDirectory = async(longName, serviceName) => {
  const dnsLongName = longName || LONG_NAME;
  const dnsServieName = serviceName || SERVICE_NAME;
  const URL = `${END_POINT}/${dnsServieName}/${dnsLongName}`;
  return await axios.get(URL, getHeaders());
};

export const getFiles = async(longName, serviceName, filePath) => {
  const dnsLongName = longName || LONG_NAME;
  const dnsServieName = serviceName || SERVICE_NAME;
  const URL = `${END_POINT}/${dnsServieName}/${dnsLongName}/${filePath}`;
  return await axios.get(URL, getHeaders());
};

export const listLongNames = async() => (await axios.get(END_POINT, getHeaders()));

export const listServices = async(longName) => {
  const dnsLongName = longName || LONG_NAME;
  const URL = `${END_POINT}/${dnsLongName}`;
  return await axios.get(URL, getHeaders());
};

// Tests

export const registerDnsTest = async() => {
  try {
    const dirName = 'dnsDir';
    const createDirResponse = await nfs.createDir(dirName);
    should(createDirResponse.status).equal(200);
    const registerDnsResponse = await registerDns(null, null, dirName);
    should(registerDnsResponse.status).equal(200);
    const deleteServiceResponse = await deleteServiceName();
    should(deleteServiceResponse.status).equal(200);
    const deleteLongnameResponse = await deleteLongName();
    should(deleteLongnameResponse.status).equal(200);
    const deleteDirResponse = await nfs.deleteDir(dirName);
    should(deleteDirResponse.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const registerDnsNegativeTest = async() => {
  try {
    await registerDns(null, null, '/notFound');
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(-1502);
  } finally {
    const deleteLongnameResponse = await deleteLongName();
    should(deleteLongnameResponse.status).equal(200);
  }
};

export const createLongNameTest = async() => {
  try {
    const response = await createLongName();
    should(response.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const createLongNameNegativeTest = async() => {
  try {
    await createLongName();
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(-1001);
  }
  try {
    await createLongName('notFound');
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(400);
  }
};

export const deleteLongNameTest = async() => {
  try {
    const response = await deleteLongName();
    should(response.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const deleteLongNameNegativeTest = async() => {
  try {
    await deleteLongName();
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(-1002);
  }
};

export const addAndDeleteServiceTest = async() => {
  try {
    const dirName = 'dnsDir';
    const createDirResponse = await nfs.createDir(dirName);
    should(createDirResponse.status).equal(200);
    const addServiceResponse = await addService(null, null, dirName);
    should(addServiceResponse.status).equal(200);
    const deleteServiceResponse = await deleteServiceName();
    should(deleteServiceResponse.status).equal(200);
    const deleteDirResponse = await nfs.deleteDir(dirName);
    should(deleteDirResponse.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const addServiceNegativeTest = async() => {
  try {
    await addService(null, null, '/notFound');
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(-1502);
  }
  const dirName = 'dnsDir';

  try {
    await addService(null, 'IamGroot', '/notFound');
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(400);
  }

  try {
    const createDirResponse = await nfs.createDir(dirName);
    should(createDirResponse.status).equal(200);
    await addService('notfound', null, dirName);
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(-1002);
  } finally {
    const deleteDirResponse = await nfs.deleteDir(dirName);
    should(deleteDirResponse.status).equal(200);
  }
};

export const deletServiceNegativeTest = async() => {
  try {
    await deleteServiceName(null, null);
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(-1004);
  }
};

export const getHomeDirectoryTest = async() => {
  try {
    const dirName = 'dnsDir';
    const createDirResponse = await nfs.createDir(dirName);
    should(createDirResponse.status).equal(200);
    const addServiceResponse = await addService(null, null, dirName);
    should(addServiceResponse.status).equal(200);
    const getHomeDirResponse = await getHomeDirectory();
    should(getHomeDirResponse.data.info.name).equal(dirName);
    should(getHomeDirResponse.status).equal(200);
    const deleteServiceResponse = await deleteServiceName();
    should(deleteServiceResponse.status).equal(200);
    const deleteDirResponse = await nfs.deleteDir(dirName);
    should(deleteDirResponse.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const getFilesTest = async() => {
  try {
    const dirName = 'dnsDir';
    const fileName = 'dnsFile.txt';
    const filePath = `${dirName}/${fileName}`;
    const fileContent = 'This is DNS test';

    const createDirResponse = await nfs.createDir(dirName);
    should(createDirResponse.status).equal(200);
    const createFileResponse = await nfs.createFile(filePath, fileContent);
    should(createFileResponse.status).equal(200);
    const addServiceResponse = await addService(null, null, dirName);
    should(addServiceResponse.status).equal(200);
    const getFilesResponse = await getFiles(null, null, filePath);
    should(getFilesResponse.status).equal(200);
    const deleteServiceResponse = await deleteServiceName();
    should(deleteServiceResponse.status).equal(200);
    const deleteDirResponse = await nfs.deleteDir(dirName);
    should(deleteDirResponse.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};


export const getLongNamesTest = async() => {
  try {
    const response = await listLongNames();
    should(response.data.indexOf(LONG_NAME)).not.eql(-1);
    should(response.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const listServiceNamesTest = async() => {
  try {
    const dirName = 'dnsDir';
    const createDirResponse = await nfs.createDir(dirName);
    should(createDirResponse.status).equal(200);
    const addServiceResponse = await addService(null, null, dirName);
    should(addServiceResponse.status).equal(200);
    const listServiceNamesResponse = await listServices();
    should(listServiceNamesResponse.data.indexOf(SERVICE_NAME)).not.eql(-1);
    should(listServiceNamesResponse.status).equal(200);
    const deleteServiceResponse = await deleteServiceName();
    should(deleteServiceResponse.status).equal(200);
    const deleteDirResponse = await nfs.deleteDir(dirName);
    should(deleteDirResponse.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};
