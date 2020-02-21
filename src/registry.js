const Command = require('./commands/command');
const CommandGroup = require('./commands/group');

class CommandRegistry {
    constructor(commander) {
        /**
		 * Commander instance this registry is for
		 * @type {Commander}
		 * @readonly
		 */
        this.commander = commander;

        /**
		 * Registered commands, mapped by their name
		 * @type {Map<string, Command>}
		 */
		this.commands = new Map();

		/**
		 * Registered command groups, mapped by their ID
		 * @type {Map<string, CommandGroup>}
		 */
        this.groups = new Map();
        
        /**
		 * Registered argument types, mapped by their ID
		 * @type {Map<string, ArgumentType>}
		 */
		this.types = new Map();

		/**
		 * Fully resolved path to the bot's commands directory
		 * @type {?string}
		 */
		this.commandsPath = null;

		/**
		 * Command to run when an unknown command is used
		 * @type {?Command}
		 */
		this.unknownCommand = null;
    }

    /**
	 * Registers a single group
	 * @param {CommandGroup|Function|Object|string} group - A CommandGroup instance, a constructor, or the group ID
	 * @param {string} [name] - Name for the group (if the first argument is the group ID)
	 * @param {boolean} [guarded] - Whether the group should be guarded (if the first argument is the group ID)
	 * @return {CommandRegistry}
	 * @see {@link CommandRegistry#registerGroups}
	 */
	registerGroup(group, name, guarded) {
		if(typeof group === 'string') {
			group = new CommandGroup(this.commander, group, name, guarded);
		} else if(typeof group === 'object' && !(group instanceof CommandGroup)) {
			group = new CommandGroup(this.commander, group.id, group.name, group.guarded);
		}

		const existing = this.groups.get(group.id);
		if(existing) {
			existing.name = group.name;
		} else {
			this.groups.set(group.id, group);
		}

		return this;
	}

	/**
	 * Registers multiple groups
	 * @param {CommandGroup[]|Function[]|Object[]|Array<string[]>} groups - An array of CommandGroup instances,
	 * constructors, plain objects (with ID, name, and guarded properties),
	 * or arrays of {@link CommandoRegistry#registerGroup} parameters
	 * @return {CommandoRegistry}
	 * @example
	 * registry.registerGroups([
	 * 	['fun', 'Fun'],
	 * 	['mod', 'Moderation']
	 * ]);
	 * @example
	 * registry.registerGroups([
	 * 	{ id: 'fun', name: 'Fun' },
	 * 	{ id: 'mod', name: 'Moderation' }
	 * ]);
	 */
	registerGroups(groups) {
		if(!Array.isArray(groups)) throw new TypeError('Groups must be an Array.');
		for(const group of groups) {
			if(Array.isArray(group)) this.registerGroup(...group);
			else this.registerGroup(group);
		}
		return this;
    }

    _checkExisting(nameOrAlias) {
        for (const [cmdName, cmd] of this.commands) {
			if (cmdName === nameOrAlias || cmd.aliases.includes(nameOrAlias)) {
                return true;
            }
        }

        return false;
    }
    
    /**
	 * Registers a single command
	 * @param {Command|Function} command - Either a Command instance, or a constructor for one
	 * @return {CommandoRegistry}
	 * @see {@link CommandoRegistry#registerCommands}
	 */
	registerCommand(command) {
		if(typeof command === 'function') command = new command(this.commander);
		else if(typeof command.default === 'function') command = new command.default(this.commander);

		if(!(command instanceof Command)) throw new Error(`Invalid command object to register: ${command}`);

        // Make sure there aren't any conflicts
        if(this._checkExisting(command.name)) {
            throw new Error(`A command with the name/alias "${command.name}" is already registered.`);
        }
        
		for(const alias of command.aliases) {
            if(this._checkExisting(alias)) {
                throw new Error(`A command with the name/alias "${alias}" is already registered.`);
            }
        }
        
		// const group = this.groups.get(command.groupID);
        // if(!group) throw new Error(`Group "${command.groupID}" is not registered.`);
        // for(const [_, cmd] of group.commands) {
        //     if(cmd.memberName === command.memberName) {
        //         throw new Error(`A command with the member name "${command.memberName}" is already registered in ${group.id}`);
        //     }
        // }
        
		if(command.unknown && this.unknownCommand) throw new Error('An unknown command is already registered.');

		// Add the command
		// command.group = group;
		// group.commands.set(command.name, command);
		this.commands.set(command.name, command);
		if(command.unknown) this.unknownCommand = command;


		return this;
	}

	/**
	 * Registers multiple commands
	 * @param {Command[]|Function[]} commands - An array of Command instances or constructors
	 * @param {boolean} [ignoreInvalid=false] - Whether to skip over invalid objects without throwing an error
	 * @return {CommandoRegistry}
	 */
	registerCommands(commands, ignoreInvalid = false) {
		if(!Array.isArray(commands)) throw new TypeError('Commands must be an Array.');
		for(const command of commands) {
			const valid = typeof command === 'function' || typeof command.default === 'function' ||
				command instanceof Command || command.default instanceof Command;
			if(ignoreInvalid && !valid) {
				continue;
			}
			this.registerCommand(command);
		}
		return this;
	}

	/**
	 * Finds a command that matches the search string
	 * @param {string} searchString - The string to search for
	 * @return {?Command} command found
	 */
	findCommand(searchString) {
		if(searchString) {
			const lcSearch = searchString.toLowerCase();
			for(let cmd of this.commands.values()) {
				if(cmd.name === lcSearch || (cmd.aliases && cmd.aliases.includes(lcSearch))) {
					return cmd;
				}
			}
		}

		return false;
	}

}

module.exports = CommandRegistry;