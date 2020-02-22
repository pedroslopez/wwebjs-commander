const WWebJS = require('whatsapp-web.js');

const CommandRegistry = require('./registry');
const CommandDispatcher = require('./dispatcher');

class CommanderClient {
    constructor(client, options = {}) {
        if(!(client instanceof WWebJS.Client)) {
            throw Error('Client must be a whatsapp-web.js client');
        }

        this._options = options; 

        this.client = client;

        if(typeof options.prefix === 'undefined') options.prefix = '!';
        
        this.registry = new CommandRegistry(this);

        this.dispatcher = new CommandDispatcher(this, this.registry);
        
        this._commandPrefix = options.prefix;

        this.client.on('message', message => this.dispatcher.handleMessage(message));

    }

    isOwner(userId) {
        if(!this._options.owner) return false;
        if(!this.userId) throw 'Invalid userId';
        if(typeof this._options.owner === 'string') return userId === this._options.owner;
        if(this._options.owner instanceof Array) return this._options.owner.includes(userId);
        if(this._options.owner instanceof Set) return this._options.owner.has(userId);

        throw "The client's 'owner' option has an invalid value";

    }
}

module.exports = CommanderClient;