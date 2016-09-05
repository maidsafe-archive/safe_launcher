import NFS from './mod/nfs';
import DNS from './mod/dns';
import Auth from './mod/auth';
import ClientStats from './mod/client_stats';
import * as client from './ffi/client.js';

export var auth = new Auth(client.send);
export var clientStats = new ClientStats(client.send);
export var connectWithUnauthorisedClient = client.connectWithUnauthorisedClient;
export var close = client.close;
export var dns = new DNS(client.send);
export var nfs = new NFS(client.send);
export var reset = client.reset;
export var setNetworkStateListener = client.setNetworkStateListener;
