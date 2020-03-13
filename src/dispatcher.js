const { escapeRegex } = require('./util');

/** Handles parsing messages and returning commands from them */
class CommandDispatcher {
    /**
     * @param {Commander} client Client the dispatcher is for
     * @param {CommandRegistry} registry Registry the dispatcher will use
     */
    constructor(commander, registry) {
        /**
		 * Commander instance this dispatcher handles messages for
		 * @type {Commander}
		 * @readonly
		 */
        this.commander = commander;

        /**
		 * Registry this dispatcher uses
		 * @type {CommandRegistry}
		 */
        this.registry = registry;
        
        /**
		 * Map object of {@link RegExp}s that match command messages, mapped by string prefix
		 * @type {RegExp}
		 * @private
		 */
        this._commandPattern;
    }

    /**
	 * Parses a message to find details about command usage in it
	 * @param {Message} message - The message
	 * @return {?CommanderMessage}
	 * @private
	 */
	parseMessage(message) {
		const prefix = this.commander._commandPrefix;
		if(!this._commandPattern) this.buildCommandPattern(prefix);

		const matches = this._commandPattern.exec(message.body);
		if(!matches) return null;

		const command = this.registry.findCommand(matches[2]);
		if(!command) return null;

		const argString = message.body.substring(matches[1].length + matches[2].length);
		const args = command.parseArgs(argString);

		return { command, args }
	}

	/**
	 * Handle a new message or a message update
	 * @param {Message} message - The message to handle
	 * @return {Promise<void>}
	 * @private
	 */
	async handleMessage(message) {
		const parsed = this.parseMessage(message);
		if(parsed && parsed.command) {
			const command = parsed.command;

			// Validations
			const chat = await message.getChat();

			if(!command._globalEnabled) {
				return message.reply(`The \`\`\`${command.name}\`\`\` command has been temporarily disabled.`);
			}

			if(command.replyOnly && !message.hasQuotedMsg) {
				return message.reply(`The \`\`\`${command.name}\`\`\` command can only be used when replying to another message.`);
			}
			
			if(command.groupOnly && !chat.isGroup) {
				return message.reply(`The \`\`\`${command.name}\`\`\` command can only be used in a group chat.`);
			}

			const hasPermission = await command.hasPermission(message);
			if(!hasPermission || typeof hasPermission === 'string') {
				if(typeof hasPermission === 'string') return message.reply(hasPermission);
				else return message.reply(`You do not have permission to use the \`\`\`${command.name}\`\`\` command.`);
			}

			// Args
			const argsResult = await command.obtainArgs(message, parsed.args);
			if(argsResult.error) {
				return message.reply(`Invalid arguments provided. You can run \`\`\`!help ${command.name}\`\`\` to get more info.`);
			}

			const args = argsResult.values;

			// Run command
			try {
				await command.run(message, args);
			} catch(error) {
				console.error(error);
				message.reply('🔥 An error occurred while trying to execute the command!');
			}

		}
		
    }

	/**
	 * Creates a regular expression to match the command prefix and name in a message
	 * @param {?string} prefix - Prefix to build the pattern for
	 * @return {RegExp}
	 * @private
	 */
	buildCommandPattern(prefix) {
		const myNumber = this.commander.client.info.me.user;
		let pattern;
		if(prefix) {
			const escapedPrefix = escapeRegex(prefix);
			pattern = new RegExp(
				`^(@${myNumber}\\s+(?:${escapedPrefix}\\s*)?|${escapedPrefix}\\s*)([^\\s]+)`, 'i'
			);
		} else {
			pattern = new RegExp(`(^@${myNumber}\\s+)([^\\s]+)`, 'i');
		}
		this._commandPattern = pattern;
		return pattern;
	}

}

module.exports = CommandDispatcher;