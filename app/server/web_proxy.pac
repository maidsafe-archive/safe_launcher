function FindProxyForURL(url, host) {
    if (shExpMatch(host, "*.safenet"))
     return "PROXY localhost:60000";

    return "DIRECT";
}
