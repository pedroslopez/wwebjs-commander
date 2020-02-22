const Argument = require('./argument');

class Command {
    constructor(commander, info) {
		this.constructor.validateInfo(commander, info);

        /**
		 * Client this command is for
		 * @type {string}
         * @readonly
		 */
        this.commander = commander;

        /**
		 * Name of this command
		 * @type {string}
		 */
		this.name = info.name;

		/**
		 * Aliases for this command
		 * @type {string[]}
		 */
		this.aliases = info.aliases || [];
		if(typeof info.autoAliases === 'undefined' || info.autoAliases) {
			if(this.name.includes('-')) this.aliases.push(this.name.replace(/-/g, ''));
			for(const alias of this.aliases) {
				if(alias.includes('-')) this.aliases.push(alias.replace(/-/g, ''));
			}
		}

		/**
		 * Short description of the command
		 * @type {string}
		 */
		this.description = info.description;

		/**
		 * Usage format string of the command
		 * @type {string}
		 */
		this.format = info.format || null;

		/**
		 * Whether the command can only be used while replying to another message
		 * @type {boolean}
		 */
		this.replyOnly = Boolean(info.replyOnly);

		/**
		 * Whether the command can only be run in a group chat
		 * @type {boolean}
		 */
		this.groupOnly = Boolean(info.groupOnly);

		/**
		 * Whether the command can only be used by an owner
		 * @type {boolean}
		 */
		this.ownerOnly = Boolean(info.ownerOnly);

		/**
		 * Whether the command can only be used if the client is a group admin.
		 * @type {boolean}
		 */
		this.clientAdminOnly = Boolean(info.clientAdminOnly) || null;

		/**
		 * Whether the command can only be used by a group admin.
		 * @type {boolean}
		 */
		this.adminOnly = Boolean(info.adminOnly) || null;

		/**
		 * Whether the command should be hidden from the help command
		 * @type {boolean}
		 */
		this.hidden = Boolean(info.hidden);

		/**
		 * Whether the command is enabled globally
		 * @type {boolean}
		 * @private
		 */
		this._globalEnabled = true;

		/**
		 * Command Arguments
		 * @type {Argument[]}
		 */
		this.args = new Array(info.args ? info.args.length : 0);

		if(info.args) {
			let hasInfinite = false;
			let hasOptional = false;
			for(let i = 0; i < info.args.length; i++) {
				if(hasInfinite) throw new Error('No other argument may come after an infinite argument.');
				if(info.args[i].optional) hasOptional = true;
				else if(hasOptional) throw new Error('Required arguments may not come after optional arguments.');
				this.args[i] = new Argument(this.commander, info.args[i]);
				if(this.args[i].infinite) hasInfinite = true;
			}
		}

		if(info.args && typeof info.format === 'undefined') {
			this.format = this.args.reduce((prev, arg) => {
				const wrapL = arg.default !== null ? '[' : '<';
				const wrapR = arg.default !== null ? ']' : '>';
				return `${prev}${prev ? ' ' : ''}${wrapL}${arg.label}${arg.infinite ? '...' : ''}${wrapR}`;
			}, '');
		}
		
    }

    /**
	 * Checks whether the user has permission to use the command
	 * @param {CommanderMessage} message - The triggering command message
	 * @param {boolean} [ownerOverride=true] - Whether the bot owner(s) will always have permission
	 * @return {boolean|string} Whether the user has permission, or an error message to respond with if they don't
	 */
	async hasPermission(message, ownerOverride = true) {
        if(!this.ownerOnly && !this.adminOnly) return true;
        const authorId = message.author || message.from;
		if(ownerOverride && this.commander.isOwner(authorId)) return true;

		if(this.ownerOnly && (ownerOverride || !this.commander.isOwner(authorId))) {
			return `The \`\`\`${this.name}\`\`\` command can only be used by the bot owner.`;
		}

		if(this.adminOnly) {
			let chat = await message.getChat();
			if (chat.isGroup) {
				for(let participant of chat.participants) {
					if(participant.id._serialized === authorId && !participant.isAdmin) {
						return `The \`\`\`${this.name}\`\`\` command can only be used by group admins.`;
					}
				}
			}
		}

		return true;
    }
    
    /**
	 * Runs the command
	 * @param {CommanderMessage} message - The message the command is being run for
	 * @param {Object|string|string[]} args - The arguments for the command, or the matches from a pattern.
	 * If args is specified on the command, these will be the argument values object. If argsType is single, then only
	 * one string will be passed. If multiple, an array of strings will be passed. When fromPattern is true, this is the
	 * matches array from the pattern match
	 * (see [RegExp#exec](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)).
	 * @param {boolean} fromPattern - Whether or not the command is being run from a pattern match
	 * @param {?ArgumentCollectorResult} result - Result from obtaining the arguments from the collector (if applicable)
	 * @return {Promise<?Message|?Array<Message>>}
	 * @abstract
	 */
	async run(message, args) { 
		throw new Error(`${this.constructor.name} doesn't have a run() method.`);
	}

	async obtainArgs(message, provided = []) {
		const values = {};

		for(let i=0; i<this.args.length; i++) {
			const arg = this.args[i];

			let result = arg.infinite ? provided.slice(i) : provided[i];
			const empty = (arg.infinite && result.length === 0) || typeof provided[i] === 'undefined';
			if(empty && arg.default !== null) {
				result = typeof arg.default === 'function' ? await arg.default(message, this) : arg.default; 
			} else if(empty) {
				return {values, error: true} 
			}

			values[arg.key] = result;
		}

		return {values, error: false};
	}
	
	/**
	 * Parses the argString into usable arguments, based on the argsType and argsCount of the command
	 * @param {string} argString
	 * @return {string|string[]}
	 * @see {@link Command#run}
	 */
	parseArgs(argString) {
		argString = argString.trim();
		let argCount = this.args.length > 0 && this.args[this.args.length - 1].infinite ? Infinity : this.args.length;

		const re = /\s*(?:("|“)([^]*?)(\1|”)|(\S+))\s*/g;
		const result = [];
		let match = [];
		// Large enough to get all items
		argCount = argCount || argString.length;
		// Get match and push the capture group that is not null to the result
		while(--argCount && (match = re.exec(argString))) {
			result.push(match[2] || match[4]);
		} 
		// If text remains, push it to the array as-is (except for wrapping quotes, which are removed)
		if(match && re.lastIndex < argString.length) {
			const re2 = /^("|“)([^]*)(\1|”)$/g;
			result.push(argString.substr(re.lastIndex).replace(re2, '$2'));
		}
		return result;
	}
    
    /**
	 * Creates a usage string for the command
	 * @param {string} [argString] - A string of arguments for the command
	 * @param {string} [prefix=this.commander._commandPrefix] - Prefix to use for the prefixed command format
	 * @return {string}
	 */
	usage(argString, prefix = this.commander._commandPrefix) {
		let format = argString ? ` ${argString}` : (this.format ? ` ${this.format}` : '');
		let cmdUsg = `${this.name}${format}`;
		
		if(!prefix) return `\`\`\`${cmdUsg}\`\`\``;

        if(prefix.length > 1 && !prefix.endsWith(' ')) prefix += ' ';
        return `\`\`\`${prefix}${cmdUsg}\`\`\``;
    }

    /**
	 * Validates the constructor parameters
	 * @param {CommanderClient} client - Client to validate
	 * @param {CommandInfo} info - Info to validate
	 * @private
	 */
	static validateInfo(client, info) {
		if(!client) throw new Error('A client must be specified.');
		if(typeof info !== 'object') throw new TypeError('Command info must be an Object.');
		if(typeof info.name !== 'string') throw new TypeError('Command name must be a string.');
		if(info.name !== info.name.toLowerCase()) throw new Error('Command name must be lowercase.');
		if(info.aliases && (!Array.isArray(info.aliases) || info.aliases.some(ali => typeof ali !== 'string'))) {
			throw new TypeError('Command aliases must be an Array of strings.');
		}
		if(info.aliases && info.aliases.some(ali => ali !== ali.toLowerCase())) {
			throw new RangeError('Command aliases must be lowercase.');
		}
		if(typeof info.description !== 'string') throw new TypeError('Command description must be a string.');
		if('format' in info && typeof info.format !== 'string') throw new TypeError('Command format must be a string.');
		if(info.args && !Array.isArray(info.args)) throw new TypeError('Command args must be an Array.');
	}
}

module.exports = Command;