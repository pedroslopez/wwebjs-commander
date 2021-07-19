function escapeRegex(str) {
	return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

const isConstructorProxyHandler = { construct() { return Object.prototype; } };
function isConstructor(func, _class) {
	try {
		// eslint-disable-next-line no-new
		new new Proxy(func, isConstructorProxyHandler)();
		if(!_class) return true;
		return func.prototype instanceof _class;
	} catch(err) {
		return false;
	}
}

module.exports = {
    escapeRegex,
    isConstructor
}