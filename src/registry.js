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
        
		// Add the command
		this.commands.set(command.name, command);

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
	 * Registers all commands in a directory. The files must export a Command class constructor or instance.
	 * @param {string|RequireAllOptions} options - The path to the directory, or a require-all options object
	 * @return {CommandRegistry}
	 */
	registerCommandsIn(options) {
		const obj = require('require-all')(options);
		const commands = [];
		for(let command of Object.values(obj)) {
			if(typeof command.default === 'function') command = command.default;
			if(typeof command === 'function') commands.push(command);
		}

		return this.registerCommands(commands);
	}

	/**
	 * Registers the default commands to the registry
	 * @param {Object} [options] - Object specifying what commands to register
	 * @param {boolean} [options.help=true] - Whether or not to register the built-in help command
	 * @param {boolean} [options.ping=true] - Whether or not to register the built-in ping command
	 * @param {boolean} [options.commandState=true] - Whether or not to register the built-in enable/disable command commands
	 * @return {CommandRegistry}
	 */
	registerDefaultCommands({ help = true, ping = true, commandState = true } = {}) {
		if(help) this.registerCommand(require('./commands/util/help'));
		if(ping) this.registerCommand(require('./commands/util/ping'));
		if(commandState) {
			this.registerCommands([
				require('./commands/util/disable'),
				require('./commands/util/enable')
			]);
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