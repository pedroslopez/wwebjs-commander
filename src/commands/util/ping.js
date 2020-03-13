const Command = require('../command');

class PingCommand extends Command {
	constructor(commander) {
        super(commander, {
            name: 'ping',
            aliases: ['latency'],
            description: 'Pings and checks the time it takes for the message to be sent to the server.'
        });

        commander.client.on('message_ack', this.onAck.bind(this));
        this.awaitingAck = {};
    }

    async onAck(message, ack) {
        let sentTime = this.awaitingAck[message.id._serialized];

        if(ack > 0 && sentTime) {
            delete this.awaitingAck[message.id._serialized];
            
            let ms = new Date().getTime() - sentTime;
            message.reply(`Ping took ${ms}ms`);
        }
    }

    async run(message) {
        let chat = await message.getChat();
        let pingMsg = await chat.sendMessage('Pinging...');
        this.awaitingAck[pingMsg.id._serialized] = new Date().getTime();
    }
};

module.exports = PingCommand;