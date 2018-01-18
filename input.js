const globals = require('./globals.js');

module.exports = globals.declare('input', () => 
{
    let input = [];
    let command = '';

    let self = {
        addCommand: function (command) {
            for (let i = 0; i < command.length; i++)
                input.push(command.charCodeAt(i));
                input.push(10);
        },

        hasInput: function() {
            return (input.length !== 0);
        },

        willRead: function() {

        },

        didRead: function(input) {
            console.log('> ' + input);
        },

        getData: function(callback) {
            process.stdin.once('data', (data) => {
                callback(data);
            });
        },
        
        read: function (callback) {
            self.willRead();
            if (input.length === 0) {
                self.getData((data) => {
                    input.push(...data);
                    process.nextTick(() => {
                        self.read(callback);
                    });
                });
            } else {
                let char = input.shift();

                if (char === 3)
                    process.exit(-1);

                if (char === 13) // replace cr with lf
                    char = 10;

                if (char === 10) {
                    self.didRead(command);
                    command = '';
                }
                else
                    command += String.fromCharCode(char);

                process.nextTick( () => {
                    callback(char);
                });
            }
        }
    };

    return self;
});