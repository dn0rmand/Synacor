
const globals = require('./globals.js');

module.exports = globals.declare('ui', () => 
{
    const input = require('./input.js');
    const output = require('./output.js');
    const blessed = require("blessed");
    
    let isDirty = false;
    let ui;

    function getScreen()
    {
        let screen = blessed.Screen({
            smartCSR: true,
            dockBorders: true
        });
        screen.title = 'Synacor Challenge';

        const $exit = process.exit;

        process.exit = function (code) {
            screen.destroy();
            $exit(code);
        }
    
        return screen;        
    }

    function createToolbar(screen)
    {
        var box = blessed.Box({
            parent:screen,
            top: 30,
            left: 100,
            height:3,
            border:{type:'line'},
            style: {
                fg: 'white',
                bg: 'blue',
                border: {
                    fg: 'white',
                    bg: 'blue'
                }
            }
        });

        var run = blessed.Box({
            parent:box,
            top: 0,
            left: 2,
            width: 3,
            height: 1,
            content: ' ▶ ︎',
            tags: false,
            style: {
              fg: 'white',
              bg: 'blue',
            }
          });

        run.on("click", () => {
            console.log('pressed GO');
        });

        var stepOver = blessed.Box({
            parent:box,
            top: 0,
            left: 6,
            width: 3,
            height: 1,
            content: ' → ',
            tags: false,
            style: {
              fg: 'white',
              bg: 'blue',
            }
          });

        stepOver.on("click", () => {
            console.log('pressed stepOver');
        });

        var stepIn = blessed.Box({
            parent:box,
            top: 0,
            left: 10,
            width: 3,
            height: 1,
            content: ' ↓ ',
            tags: false,
            style: {
              fg: 'white',
              bg: 'blue',
            }
          });

        stepIn.on("click", () => {
            console.log('pressed stepIn');
        });

        var stepOut = blessed.Box({
            parent:box,
            top: 0,
            left: 14,
            width: 3,
            height: 1,
            content: ' ↑ ',
            tags: false,
            style: {
              fg: 'white',
              bg: 'blue',
            }
          });

        stepOut.on("click", () => {
            console.log('pressed stepOut');
        });

        var breakPoint = blessed.Box({
            parent:box,
            top: 0,
            left: 18,
            width: 3,
            height: 1,
            content: ' ⌦ ',
            tags: false,
            style: {
              fg: 'white',
              bg: 'blue',
            }
          });

        breakPoint.on("click", () => {
            console.log('pressed breakPoint');
        });
    }

    function getCodeBox(screen)
    {
        let box = blessed.List({
            label: 'Code',
            parent: screen,
            top: 0,
            left: 100,
            width: screen.width - 100,
            height: 30,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                bg: 'black',
                border: {
                    fg: 'white',
                    bg: 'black'
                }
            },
            mouse: true,
            input: true
        });        

        return box;
    }

    function getOutputBox(screen)
    {
        let outputBox = blessed.Log({
            parent: screen,
            top: 0,
            left: 0,
            label: 'Output',
            width: 100,
            height: 30,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                bg: 'blue',
                border: {
                    fg: 'white',
                    bg: 'blue'
                }
            },
            input: false
        });        

        output.didPrint = function (value) {
            outputBox.log(value);
            isDirty = true;
        }
    
        return outputBox;
    }

    function getInputBox(screen, outtbox)
    {
        let inputBox = blessed.Textbox({
            parent: screen,
            name: 'input',
            label: 'Input',
            input: true,
            keys: true,
            top: screen.height-3,
            left: 0,
            height: 3,
            width: screen.width-90,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                bg: 'blue',
                border: {
                    fg: 'white',
                    bg: 'blue'
                }
            }
        });  

        inputBox.on('submit', (data) => {
            if (data == '')
                return;
            if (data == 'exit')
                process.exit(0);

            input.addCommand(data);
            if (outputBox !== undefined) {
                outputBox.setContent('');
                outputBox.resetScroll();
            }
            isDirty = true;
        });

        input.getData = function (callback) 
        {
            inputBox.clearValue();
            inputBox.focus();

            inputBox.readInput(() => { 
                callback([]); 
            });
        }

        inputBox.focus();
        inputBox.on('blur', () => {
            if (screen.focused != inputBox)
                inputBox.focus();
        })
        return inputBox;
    }

    function getRegisterBox(screen)
    {
        let registers = {};

        let width = 90;
        let registerBox = blessed.Box({
            label: 'Registers',
            parent: screen,
            top: screen.height-3,
            left: screen.width-width,
            width: width,
            height: 3,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                bg: 'blue',
                border: {
                    fg: 'white',
                    bg: 'blue'
                }
            }
        });

        let first = 'A'.charCodeAt(0);
        for(let i = 0; i < 8; i++)
        {
            let name = String.fromCharCode(first + i);
            let label = blessed.Text({
                parent:registerBox, 
                top: 0,
                left: (i*11)+1,
                width: 2,
                height:1,
                tags:true,
                style: {
                    fg: 'white',
                    bg: 'blue'
                }
            });
            label.setContent('{bold}' + name + '{/bold}:');
            let value = blessed.Textbox({
                parent:registerBox,
                top:0,
                left: (i*11) + 4,
                width: 7,
                height:1,
                style: {
                    fg: 'white',
                    bg: 'blue'
                }                
            });
            value.setValue(globals.asHexa(0, 4));
            registers[name] = value;
        }

        return registers;//Box;
    }

    function getDebugBox(screen)
    {
        let traceBox = blessed.Log({
            parent: screen,
            label: 'Debug Output',
            top: 30,
            left: 0,
            width: 100,
            height: 17,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                bg: 'red',
                border: {
                    fg: 'white',
                    bg: 'red'
                }
            },
            input: false
        });
    
        console.log = function(value) {
            traceBox.log(value);
            screen.render();
        }

        return traceBox;
    }

    let screen      = getScreen();
    let outputBox   = getOutputBox(screen);
    let traceBox    = getDebugBox(screen);
    let registerBox = getRegisterBox(screen);
    let inputBox    = getInputBox(screen, outputBox);
    let codeBox     = getCodeBox(screen);

    createToolbar(screen);

    screen.render();

    ui = {
        screen:     screen,
        output:     outputBox,
        input:      inputBox,
        registers:  registerBox,
        trace:      traceBox,
        code:       codeBox,

        updateCode: function() {},
        updateRegister: function(name, value) {
            let box = this.registers[name];
            if (box !== undefined)
            {
                let v = globals.asHexa(value, 4);
                box.setValue(v);
                isDirty = true;
            }
        }, 
        render: function(dirty) {
            if (isDirty || dirty)
            {
                this.screen.render();
                isDirty = false;
                return true;
            }
            else
                return false;
        },
        updateAll: function()
        {
            ui.updateRegisters();
            ui.updateCode();
            ui.render();    
        }
    };

    return ui;
});
