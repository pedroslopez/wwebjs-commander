const Command = require('../command');

class HelpCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'help',
			description: 'Displays a list of available commands, or detailed information for a specified command.',
			args: [
				{
					key: 'command',
					type: 'string',
                    default: '',
				}
			]
		});
	}

	async run(message, args) { 
        if(args.command) {
            const command = this.commander.registry.findCommand(args.command);
            if(command) {
                let help = `*Name:* ${command.name}`;

                if(command.description) help += `\n*Description:* ${command.description}`;
                if(command.aliases && command.aliases.length > 0) help += `\n*Aliases:* ${command.aliases.join(', ')}`;
                
                help += `\n*Usage:* ${command.usage()}`;

                if(command.groupOnly) help += `\n\n_This command can only be used in groups_`;

                message.reply(help);
            } else {
                return message.reply('That\'s not a valid command!');
            }
            
		} else {
            let help = 'Here\'s a list of all my commands:\n';
            const cmdVals = [ ...this.commander.registry.commands.values() ];
            help += cmdVals.filter(command => !command.hidden).map(command => command.name).join(', ');
            help += `\n\nYou can send ${this.usage()} to get info on a specific command.`;

            message.reply(help);
            
		}
	}
};

module.exports = HelpCommand;