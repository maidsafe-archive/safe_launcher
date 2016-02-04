import NFS from './mod/nfs';
import Auth from './mod/auth';
import * as client from './ffi/client.js';

export var close = client.close;
export var nfs = new NFS(client.send);
export var auth = new Auth(client.send);
