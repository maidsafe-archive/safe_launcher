import fse from 'fs-extra';
import path from 'path';

let build = () => {
  const srcDir = 'app';
  const destDir = 'dist';
  const filesToMove = [
    'server',
    'api'
  ];
  filesToMove.map((file) => {
    fse.copySync(path.resolve('.', srcDir, file), path.resolve('.', destDir, file));
  });
};

build();
