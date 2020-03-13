const Command = require('../command');

class EnableCommandCommand extends Command {
	constructor(client) {
		super(client, {
            name: 'enable-command',
            aliases: ['enable', 'cmd-on', 'command-on'],
            hidden: true,
            ownerOnly: true,
            guarded: true,
			description: 'Enables a command globally.',
			args: [
				{
                    key: 'commandName',
                    label: 'command',
				}
			]
		});
	}

	async run(message, { commandName }) { 
        const command = this.commander.registry.findCommand(commandName);
        if(command) {
            if(command._globalEnabled) return message.reply(`The \`\`\`${commandName}\`\`\` command is already enabled.`);
            if(command.guarded) return message.reply(`You cannot enable the \`\`\`${commandName}\`\`\` command.`); 
            
            command._globalEnabled = true;
            message.reply(`The \`\`\`${commandName}\`\`\` has been enabled.`);
        } else {
            return message.reply('That\'s not a valid command!');
        }
	}
};

module.exports = EnableCommandCommand;