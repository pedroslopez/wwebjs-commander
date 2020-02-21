class Argument {
    constructor(client, info) {
		this.constructor.validateInfo(client, info);

        /**
		 * Key for the argument
		 * @type {string}
		 */
		this.key = info.key;

		/**
		 * Label for the argument
		 * @type {string}
		 */
		this.label = info.label || info.key;

		/**
		 * Optional
		 * @type {boolean}
		 */
		this.optional = Boolean(info.optional);

		/**
		 * Whether the argument accepts an infinite number of values
		 * @type {boolean}
		 */
		this.infinite = Boolean(info.infinite);

		/**
		 * Error message for when a value is invalid
		 * @type {?string}
		 */
		this.error = info.error || null;
	}
	
	/**
	 * Validates the constructor parameters
	 * @param {CommandoClient} client - Client to validate
	 * @param {ArgumentInfo} info - Info to validate
	 * @private
	 */
	static validateInfo(client, info) { // eslint-disable-line complexity
		if(!client) throw new Error('The argument client must be specified.');
		if(typeof info !== 'object') throw new TypeError('Argument info must be an Object.');
		if(typeof info.key !== 'string') throw new TypeError('Argument key must be a string.');
		if(info.label && typeof info.label !== 'string') throw new TypeError('Argument label must be a string.');
		if(info.error && typeof info.error !== 'string') throw new TypeError('Argument error must be a string.');
	}
}

module.exports = Argument;