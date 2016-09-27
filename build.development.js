import fse from 'fs-extra';
import os from 'os';
import path from 'path';

const build = () => {
  const srcDir = 'app';
  const destDir = 'dist';

  const LIB_NAME = {
    darwin: 'libsafe_core.dylib',
    linux: 'libsafe_core.so',
    win32: 'safe_core.dll',
  };
  const libPath = `ffi/${(LIB_NAME[os.platform()] || LIB_NAME.linux)}`;
  const filesToMove = [
    'server',
    'logger',
    'images',
    'app.html',
    libPath
  ];
  fse.remove(destDir, () => {
    fse.mkdirsSync(destDir);
    let filePath = null;
    for (filePath of filesToMove) {
      fse.copySync(path.resolve('.', srcDir, filePath), path.resolve('.', destDir, filePath));
    }
  });
};
build();
