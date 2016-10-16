import Utils from './utils';
import { CONSTANTS } from '../constants';

class DNSUtils extends Utils {
	constructor() {
		super();
	}

	register(token, longName, serviceName, serviceHomeDirPath, rootPath, config) {
		const body = {};
		if (rootPath) {
			body.rootPath = rootPath;
		}
		if (longName) {
			body.longName = longName;
		}
		if (serviceName) {
			body.serviceName = serviceName;
		}
		if (serviceHomeDirPath) {
			body.serviceHomeDirPath = serviceHomeDirPath;
		}

		return this.request(this.HTTP_METHOD.POST, CONSTANTS.API.DNS, token, body, config);
	}

	createPublicId(token, longName, config) {
		return this.request(this.HTTP_METHOD.POST, `${CONSTANTS.API.DNS}${longName}`, token, config);
	}

	addService(token, longName, serviceName, serviceHomeDirPath, rootPath, config) {
		const body = {};
		if (rootPath) {
			body.rootPath = rootPath;
		}
		if (longName) {
			body.longName = longName;
		}
		if (serviceName) {
			body.serviceName = serviceName;
		}
		if (serviceHomeDirPath) {
			body.serviceHomeDirPath = serviceHomeDirPath;
		}
		return this.request(this.HTTP_METHOD.PUT, CONSTANTS.API.DNS, token, body, config);	
	}

	deleteDns(token, longName, config) {
		return this.request(this.HTTP_METHOD.DELETE, `${CONSTANTS.API.DNS}${longName}`, token, config);	
	}

	deleteServiceName(token, longName, serviceName, config) {
		return this.request(this.HTTP_METHOD.DELETE, `${CONSTANTS.API.DNS}${serviceName}/${longName}`, token, config);
	}

	listLongNames(token, config) {
		return this.request(this.HTTP_METHOD.GET, CONSTANTS.API.DNS, token, config);
	}

	listServiceNames(token, longName, config) {
		return this.request(this.HTTP_METHOD.GET, `${CONSTANTS.API.DNS}${longName}`, token, config);
	}

	getHomeDir(token, longName, serviceName, config) {
		return this.request(this.HTTP_METHOD.GET, `${CONSTANTS.API.DNS}${serviceName}/${longName}`, token, config);
	}

	getFile(token, longName, serviceName, filePath, config) {
		return this.request(this.HTTP_METHOD.GET, `${CONSTANTS.API.DNS}${serviceName}/${longName}/${filePath}`, token, config);
	}
}

const dnsUtils = new DNSUtils();

export default dnsUtils;
