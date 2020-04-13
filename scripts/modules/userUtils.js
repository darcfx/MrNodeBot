const scriptInfo = {
    name: 'User Utilities',
    desc: 'Provides Registration and other User management functionality',
    createdBy: 'IronY',
};

const logger = require('../../lib/logger');

module.exports = app => {
    // Register a User
    // Current use case: User is already registered with services, but can register and be able to
    // identify with other nicks/hosts
    const register = async (to, from, text, message) => {
        const args = text.split(' ');

        if (!args[0]) {
            app.say(from, 'A Email is required');
            return;
        }

        if (!args[1]) {
            app.say(from, 'A Password is required');
            return;
        }

        try {
            await app._userManager.create(from, args[0], args[1], message.host);
            app.say(from, 'Your account has been created');
        } catch (err) {
            // Known MariaDB / MySql duplicate error
            if (err.errno === 1062) {
                app.say(from, `The account ${from} has already been registered`);
                return;
            }

            // Log
            logger.error('Account Registration Error', {
                err,
            });

            // Give back generic error
            app.say(from, 'Something went wrong creating your account, the username may exist');
        }
    };

    /**
     Master Account command, used for delegating to other commands or providing help
     * */
    const account = async (to, from, text, message) => {
        if (!text) {
            app.say(from, 'Please refer to my help before you tamper with me.');
            return;
        }

        // Process text
        text = text.split(' ');
        const [command] = text.splice(0, 1);

        switch (command) {
        case 'register':
            const result = await register(to, from, text.join(' '), message);
            break;
        case 'help':
            const [subCommand] = text.splice(0, 1);
            if (!subCommand) {
                app.say(from, 'The following are valid commands, use account help [command], for more information.');
                app.say(from, 'register');
                return;
            }
            switch (subCommand) {
            case 'register':
                app.say(from, '[email] [password] - Register your nickname');
                break;
            default:
                app.say(from, `${subCommand} is not a valid account command, please try account help`);
                break;
            }
            break;
        default:
            app.say(from, `${command} is not a valid account command, please try account help`);
            break;
        }
    };
    app.Commands.set('account', {
        desc: 'Account services, please use account help for more information',
        access: app.Config.accessLevels.identified,
        call: account,
    });

    // Return the script info
    return scriptInfo;
};
