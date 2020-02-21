class CommandGroup {
    constructor(commander, id, name, guarded = false) {
        if(!commander) throw new Error('A commander instance must be specified.');
		if(typeof id !== 'string') throw new TypeError('Group ID must be a string.');
		if(id !== id.toLowerCase()) throw new Error('Group ID must be lowercase.');

		/**
		 * Client that this group is for
		 * @name CommandGroup#client
		 * @type {CommanderClient}
		 * @readonly
		 */
		this.commander = commander;

		/**
		 * ID of this group
		 * @type {string}
		 */
		this.id = id;

		/**
		 * Name of this group
		 * @type {string}
		 */
		this.name = name || id;

		/**
		 * The commands in this group (added upon their registration)
		 * @type {Map<string, Command>}
		 */
		this.commands = new Map();

		/**
		 * Whether or not this group is protected from being disabled
		 * @type {boolean}
		 */
		this.guarded = guarded;

		this._globalEnabled = true;
    }
}

module.exports = CommandGroup;