import should from 'should';
import axios from 'axios';
import CONSTANTS from './constants';
import UserData from './user_data';

const userDataObj = new UserData();
const DIR_NAME = 'testDir';
const FILE_NAME = 'test.txt';
const FILE_PATH = `${DIR_NAME}/${FILE_NAME}`;
const FILE_CONTENT = 'This is test file';
const DIR_END_POINT = `${CONSTANTS.API_SERVER}/nfs/directory/APP/`;
const DIR_MOVE_END_POINT = `${CONSTANTS.API_SERVER}/nfs/movedir/`;
const FILE_END_POINT = `${CONSTANTS.API_SERVER}/nfs/file/APP/`;
const FILE_MOVE_END_POINT = `${CONSTANTS.API_SERVER}/nfs/movefile`;

const getHeaders = () => ({
  headers: {
    'content-type': 'application/json',
    Authorization: userDataObj.authToken
  }
});

export const createDir = async(dirName, payload) => {
  const directoryName = dirName || DIR_NAME;
  return await axios.post(`${DIR_END_POINT}${directoryName}`, payload || {}, getHeaders());
};

export const getDir = async(dirName) => {
  const directoryName = dirName || DIR_NAME;
  return await axios.get(`${DIR_END_POINT}${directoryName}`, getHeaders());
};

export const modifyDir = async(metadata) => {
  try {
    return await axios.put(DIR_END_POINT, {
      metadata
    }, getHeaders());
  } catch (e) {
    console.error(e);
  }
};

export const moveOrCopyDir = async(dirName, dest, actionToMove) => {
  const directoryName = dirName || DIR_NAME;
  const payload = {
    srcPath: directoryName,
    destPath: dest || '/',
    srcRootPath: 'APP',
    destRootPath: 'APP',
    action: actionToMove ? 'MOVE' : 'COPY'
  };
  return await axios.post(DIR_MOVE_END_POINT, payload, getHeaders());
};

export const deleteDir = async(dirName) => {
  const directoryName = dirName || DIR_NAME;
  return await axios.delete(`${DIR_END_POINT}${directoryName}`, getHeaders());
};

export const createFile = async(filePath, fileContent) => {
  const path = filePath || FILE_PATH;
  const content = fileContent || FILE_CONTENT;
  return await axios.post(`${FILE_END_POINT}${path}`, content, getHeaders());
};

export const getFile = async(filePath) => {
  const path = filePath || FILE_PATH;
  return await axios.get(`${FILE_END_POINT}${path}`, getHeaders());
};

export const modifyFileMeta = async(filePath, metadata) => {
  const path = filePath || FILE_PATH;
  const payload = {
    metadata: metadata || ''
  };
  return await axios.put(`${FILE_END_POINT}${path}`, payload, getHeaders());
};

export const getFileMeta = async(filePath) => {
  const path = filePath || FILE_PATH;
  return await axios.head(`${FILE_END_POINT}${path}`, getHeaders());
};

export const moveOrCopyFile = async(filePath, dest, actionToMove) => {
  const path = filePath || FILE_PATH;
  const payload = {
    srcPath: path,
    destPath: dest || `/${FILE_NAME}`,
    srcRootPath: 'APP',
    destRootPath: 'APP',
    action: actionToMove ? 'MOVE' : 'COPY'
  };
  return await axios.post(FILE_MOVE_END_POINT, payload, getHeaders());
};

export const deleteFile = async(filePath) => {
  const path = filePath || FILE_PATH;
  return await axios.delete(`${FILE_END_POINT}${path}`, getHeaders());
};

// Tests

export const createDirTest = async() => {
  try {
    const response = await createDir();
    should(response.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const createDirNegativeTest = async() => {
  try {
    await createDir();
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(-502);
  }
  try {
    await createDir(null, {
      metadata: true
    });
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.errCode).not.eql(400);
  }
  try {
    await createDir(null, {
      isPrivate: '111'
    });
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.errCode).not.eql(400);
  }
};

export const getDirTest = async() => {
  try {
    const response = await getDir();
    should(response.status).equal(200);
    should(response.data.info.name).equal(DIR_NAME);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const getDirNegativeTest = async() => {
  try {
    await getDir('/notFound');
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(-1502);
  }
};

export const modifyDirTest = async() => {
  try {
    const metadata = 'bXkgdGVzdCBkaXJlY3Rvcnk=';
    const response = await modifyDir(metadata);
    should(response.status).equal(200);
    const getResponse = await getDir();
    should(getResponse.data.info.metadata).equal(metadata);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const moveDirTest = async() => {
  try {
    const srcDir = 'moveTestHome';
    const destDir = 'moveTestHomeDest';
    const createSrcDirResponse = await createDir(srcDir);
    should(createSrcDirResponse.status).equal(200);
    const createDestDirResponse = await createDir(destDir);
    should(createDestDirResponse.status).equal(200);
    const moveDirResponse = await moveOrCopyDir(srcDir, destDir, true);
    should(moveDirResponse.status).equal(200);
    const getDestDirResponse = await getDir(destDir);
    should(getDestDirResponse.data.subDirectories[0].name).equal(srcDir);
    should(getDestDirResponse.status).equal(200);
    const deleteDestDirResponse = await deleteDir(destDir);
    should(deleteDestDirResponse.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const copyDirTest = async() => {
  try {
    const srcDir = 'copyTestHome';
    const destDir = 'copyTestHomeDest';
    const createSrcDirResponse = await createDir(srcDir);
    should(createSrcDirResponse.status).equal(200);
    const createDestDirResponse = await createDir(destDir);
    should(createDestDirResponse.status).equal(200);
    const copyDirResponse = await moveOrCopyDir(srcDir, destDir, false);
    should(copyDirResponse.status).equal(200);
    const getDestDirResponse = await getDir(destDir);
    should(getDestDirResponse.status).equal(200);
    should(getDestDirResponse.data.subDirectories[0].name).equal(srcDir);
    const getSrcDirResponse = await getDir(srcDir);
    should(getSrcDirResponse.status).equal(200);
    should(getSrcDirResponse.data.info.name).equal(srcDir);
    const deleteSrcDirResponse = await deleteDir(srcDir);
    should(deleteSrcDirResponse.status).equal(200);
    const deleteDestDirResponse = await deleteDir(destDir);
    should(deleteDestDirResponse.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const deleteDirTest = async() => {
  try {
    const response = await deleteDir();
    should(response.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const deleteDirNegativeTest = async() => {
  try {
    await deleteDir('/');
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(400);
  }
  try {
    await deleteDir('/notFound');
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(-504);
  }
};

export const createFileTest = async() => {
  try {
    const createDirResponse = await createDir();
    should(createDirResponse.status).equal(200);
    const createFileResponse = await createFile();
    should(createFileResponse.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const createFileNegativeTest = async() => {
  try {
    await createFile();
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(-505);
  }
};

export const getFileTest = async() => {
  try {
    const response = await getFile();
    should(response.data).equal(FILE_CONTENT);
    should(response.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const getFileNegativeTest = async() => {
  try {
    await getFile('/notFound/test.txt');
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(-1502);
  }
};

export const modifyAndGetFileMetaTest = async() => {
  try {
    const metadata = 'bXkgdGVzdCBkaXJlY3Rvcnk=';
    const modifyFileMetaResponse = await modifyFileMeta(null, metadata);
    should(modifyFileMetaResponse.status).equal(200);
    // TODO get file meta
  } catch (e) {
    console.error(e.response.data);
  }
};

export const moveFileTest = async() => {
  try {
    const srcDir = 'moveTestHome';
    const destDir = 'moveTestHomeDest';
    const fileName = 'moveFileTest.txt';
    const srcFilePath = `${srcDir}/${fileName}`;
    const fileContent = 'This is move file test';

    const createSrcDirResponse = await createDir(srcDir);
    should(createSrcDirResponse.status).equal(200);
    const createDestDirResponse = await createDir(destDir);
    should(createDestDirResponse.status).equal(200);
    const createFileResponse = await createFile(srcFilePath, fileContent);
    should(createFileResponse.status).equal(200);
    const moveFileResponse = await moveOrCopyFile(srcFilePath, destDir, true);
    should(moveFileResponse.status).equal(200);
    const getDestDirResponse = await getDir(destDir);
    should(getDestDirResponse.data.files[0].name).equal(fileName);
    should(getDestDirResponse.status).equal(200);
    const getFileResponse = await getFile(`${destDir}/${fileName}`);
    should(getFileResponse.status).equal(200);
    should(getFileResponse.data).equal(fileContent);
    const deleteDestDirResponse = await deleteDir(destDir);
    should(deleteDestDirResponse.status).equal(200);
    const deleteSrcDirResponse = await deleteDir(srcDir);
    should(deleteSrcDirResponse.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const copyFileTest = async() => {
  try {
    const srcDir = 'moveTestHome';
    const destDir = 'moveTestHomeDest';
    const fileName = 'moveFileTest.txt';
    const srcFilePath = `${srcDir}/${fileName}`;
    const fileContent = 'This is move file test';

    const createSrcDirResponse = await createDir(srcDir);
    should(createSrcDirResponse.status).equal(200);
    const createDestDirResponse = await createDir(destDir);
    should(createDestDirResponse.status).equal(200);
    const createSrcFileResponse = await createFile(srcFilePath, fileContent);
    should(createSrcFileResponse.status).equal(200);
    const moveFileResponse = await moveOrCopyFile(srcFilePath, destDir, false);
    should(moveFileResponse.status).equal(200);
    const getSrcDirResponse = await getDir(destDir);
    should(getSrcDirResponse.data.files[0].name).equal(fileName);
    should(getSrcDirResponse.status).equal(200);
    const getDestDirResponse = await getDir(destDir);
    should(getDestDirResponse.data.files[0].name).equal(fileName);
    should(getDestDirResponse.status).equal(200);
    const getSrcFileResponse = await getFile(srcFilePath);
    should(getSrcFileResponse.status).equal(200);
    should(getSrcFileResponse.data).equal(fileContent);
    const getDestFileResponse = await getFile(`${destDir}/${fileName}`);
    should(getDestFileResponse.status).equal(200);
    should(getDestFileResponse.data).equal(fileContent);
    const deleteDestDirResponse = await deleteDir(destDir);
    should(deleteDestDirResponse.status).equal(200);
    const deleteSrcDirResponse = await deleteDir(srcDir);
    should(deleteSrcDirResponse.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const deleteFileTest = async() => {
  try {
    const deleteFileResponse = await deleteFile();
    should(deleteFileResponse.status).equal(200);
    const deleteDirResponse = await deleteDir();
    should(deleteDirResponse.status).equal(200);
  } catch (e) {
    console.error(e.response.data);
  }
};

export const deleteFileNegativeTest = async() => {
  try {
    await deleteFile();
  } catch (e) {
    should(e.response.status).not.eql(200);
    should(e.response.data.errorCode).equal(-1502);
  }
};
