const globals = require('./globals.js');

module.exports = globals.declare('disassembler', () =>
{
    const ui = require('./ui.js');
    const vm = require('./vm.js');

    function isRegister(register) 
    {
        if (typeof (register) !== "number")
            return false;

        if (register >= 32768 && register <= 32775)
            return true;
            
        return false;
    }

    function getRegister(register) 
    {
        if (isRegister(register)) 
        {
            const reg0 = 'A'.charCodeAt(0);

            let reg = String.fromCharCode(reg0 + (register - 32768));

            return reg;
        }

        return "?";
    }

    function getValue(arg1, length) 
    {
        if (! isRegister(arg1))
        {
            if (length === undefined && arg1 >= 0 && arg1 < 10)
                return arg1;
            return globals.asHexa(arg1, length);
        }
        else
            return getRegister(arg1);
    }

    let disassembler = {
        $opcodes: [],
        $memory: vm.$memory,
        $current: 0,

        findPrevious: function(address, count)
        {
            while (count-- > 0)
            {
                let lastGood = address;
                let code;
                do
                {
                    if (address == 0)
                        break;
                    code = this.readMemory(--address);
                    if (code < this.$opcodes.length)
                    {
                        let ins = this.$opcodes[code];
                        let args = ins.argCount;
                        if (address+args+1 > lastGood)
                        {
                            code = 0x1111;//invalid
                        }
                    }
                }
                while (code >= this.$opcodes.length);
            }
            return address;
        },
        get: function () 
        {
            let address = this.$current;
            let result = '  ' + globals.asHexa(address, 4) + ': ';

            let code = this.readMemory(this.$current++);
            if (code >= this.$opcodes.length)
            {
                return ''; // Empty so no display
                // result += "DATA [" + globals.asHexa(code, 4) + "]";
            }
            else
            {
                let instruction = this.$opcodes[code];
                let args = [];

                for (let i = 0; i < instruction.argCount; i++) {
                    var c = this.readMemory(this.$current++);
                    args.push(c);
                }          

                result += instruction.fn(...args);
            }
            return result;
        },
        readMemory: function (address) {
            address <<= 1; // 2 bytes per address
            let lo = this.$memory[address];
            let hi = this.$memory[address + 1];

            return (hi << 8) | lo;
        }
    };

    ui.updateCode2 = function() 
    {
        if (address === undefined)
            address = vm.$executing;

        address = disassembler.findPrevious(address, 3);

        if (disassembler.lastAddress !== address)
        {
            let codeBox = ui.code;
            codeBox.clearItems();

            disassembler.lastAddress = address;
            disassembler.$current = address;
            for(let i = 0; i < codeBox.height-2;)
            {
                let value = disassembler.get();
                if (value != '') {
                    codeBox.add(value);
                    i++;
                }
            }
            ui.render(true);
        }
    }

    let codeMap = new Map();
    let lastSelected = -1;

    function scrollToPosition() 
    {
        function setSelection(index, select)
        {
            lastSelected = select ? index : -1;
            if (index >= 0)
            {
                let el = codeBox.getItem(index);
                el.style.bg = select ? 'green' : 'black';
            }
        }

        let codeBox = ui.code;

        setSelection(lastSelected, false);

        let address = vm.$executing;
        let index = codeMap.get(address);
        if (index === undefined)
            return;

        setSelection(index, true);

        codeBox.select(index);
        index += 14; // To show current execution line in the center

        if (index >= codeMap.size)
            index = codeMap.size-1;

        codeBox.scrollTo(index);
    }

    ui.updateCode = function() 
    {
        ui.updateCode = scrollToPosition;

        let codeBox = ui.code;

        codeBox.clearItems();

        let count = disassembler.$memory.length / 2;

        disassembler.$current = 0;
        let index = 0;
        while (disassembler.$current < count)
        {
            let addr = disassembler.$current;
            let value = disassembler.get();
            if (value != '') {
                codeBox.add(value);
                codeMap.set(addr, index++);
            }
        }
        ui.render(true);
    }

    function addOpcode(argCount, fcnt) 
    {
        let inst = {
            argCount: argCount,
            fn: fcnt
        };

        disassembler.$opcodes.push(inst);
        return inst;
    }

    // halt
    addOpcode(0, () => {
        return 'halt';
    });
    // set   
    addOpcode(2, (a, b) => {
        a = getRegister(a);
        b = getValue(b);
        return a + ' = ' + b;
    });
    // push
    addOpcode(1, (a) => {
        return 'push ' + getValue(a, 4);
    });
    // pop
    addOpcode(1, (a) => {
        return getRegister(a) + ' = pop';
    });
    // eq
    addOpcode(3, (a, b, c) => {
        return getRegister(a) + ' = (' + getValue(b) + ' == ' + getValue(c)+') ? 1 : 0'; 
    });
    // gt
    addOpcode(3, (a, b, c) => {
        return getRegister(a) + ' = (' + getValue(b) + ' > ' + getValue(c)+') ? 1 : 0'; 
    });
    // jmp
    addOpcode(1, (a) => {
        return 'jmp ' + getValue(a, 4);
    });
    // jt
    addOpcode(2, (a, b) => {
        return 'if (' + getValue(a) + ' != 0) jmp ' + getValue(b, 4);
    });
    // jf
    addOpcode(2, (a, b) => {
        return 'if (' + getValue(a) + ' == 0) jmp ' + getValue(b, 4);
    });
    // add
    addOpcode(3, (a, b, c) => {
        return getRegister(a) + ' = ' + getValue(b) + ' + ' + getValue(c);
    });
    // mult
    addOpcode(3, (a, b, c) => {
        return getRegister(a) + ' = ' + getValue(b) + ' * ' + getValue(c);
    });
    // mod
    addOpcode(3, (a, b, c) => {
        return getRegister(a) + ' = ' + getValue(b) + ' % ' + getValue(c);
    });
    // and
    addOpcode(3, (a, b, c) => {
        return getRegister(a) + ' = ' + getValue(b) + ' & ' + getValue(c);
    });
    // or
    addOpcode(3, (a, b, c) => {
        return getRegister(a) + ' = ' + getValue(b) + ' | ' + getValue(c);
    });
    // not
    addOpcode(2, (a, b) => {
        return getRegister(a) + ' = ~' + getValue(b);
    });
    // rmem
    addOpcode(2, (a, b) => {
        return getRegister(a) + ' = [ ' + getValue(b, 4) + ' ]';
    });
    // wmem
    addOpcode(2, (a, b) => {
        return '[ ' + getValue(a, 4) + ' ] = ' + getValue(b);
    });
    // call
    addOpcode(1, (a) => {
        return 'call ' + getValue(a, 4);
    });
    // ret
    addOpcode(0, () => {
        return 'return';
    });
    // out
    addOpcode(1, (a) => {
        if (isRegister(a) || a < 32)
            return 'print ' + getValue(a);                
        else
            return "print '" + String.fromCharCode(a) + "'";
    });
    // in
    addOpcode(1, (a) => {
        return getRegister(a) + ' = read';
    });
    // noop
    addOpcode(0, () => {
        return 'noop';
    });

    return disassembler;
});