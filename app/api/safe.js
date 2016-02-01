import * as client from './ffi/client.js';
import Auth from './mod/auth';

export var close = client.close;
export var auth = new Auth(client.send);
