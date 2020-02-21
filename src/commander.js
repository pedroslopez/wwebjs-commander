// const WWebJS = require('whatsapp-web.js');

const CommandRegistry = require('./registry');
const CommandDispatcher = require('./dispatcher');

class CommanderClient {
    constructor(client, options = {}) {
        // if(!(client instanceof WWebJS.Client)) {
        //     throw Error('Client must be a whatsapp-web.js client');
        // }

        this.client = client;

        if(typeof options.prefix === 'undefined') options.prefix = '!';
        
        this.registry = new CommandRegistry(this);

        this.dispatcher = new CommandDispatcher(this, this.registry);
        
        this._commandPrefix = options.prefix;

        this.client.on('message', message => this.dispatcher.handleMessage(message));

    }
}

module.exports = CommanderClient;