const Command = require('../command');

class PingCommand extends Command {
	constructor(commander) {
        super(commander, {
            name: 'ping',
            aliases: ['check'],
            groupOnly: true,
            description: 'Checks if the bot is online'
        })
    }

    run(message) {
        message.reply('pong');
    }
};

module.exports = PingCommand;