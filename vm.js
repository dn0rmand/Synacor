const globals = require('./globals.js');

module.exports = globals.declare('vm', function () 
{
    const ui = require("./ui.js");

    function getRegisterName(register) 
    {
        if (typeof (register) !== "number")
            throw "Invalid Argument";

        if (register >= 32768 && register <= 32775) {
            const reg0 = 'A'.charCodeAt(0);

            let reg = String.fromCharCode(reg0 + (register - 32768));

            return reg;
        }

        throw "Invalid Argument";
    }

    function getRegisterOrValue(arg1) 
    {
        if (typeof (arg1) !== "number")
            throw "Invalid Argument";

        if (arg1 >= 0 && arg1 <= 32767)
            return arg1;

        return getRegisterName(arg1);
    }

    let vm = {
        $hCount: 0,
        $registers: {},
        $opcodes: [],
        $stack: [],
        $memory: [],
        $executing: 0,
        $current: 0,
        $debugging: false,
        read: function (callback) {},
        print: function (value) {},
        resume: function () {
            while (this.$current >= 0) {
                this.$executing = this.$current;

                let code = this.readMemory(this.$current++);
                if (code >= this.$opcodes.length)
                    throw "Invalid opcode";
                let instruction = this.$opcodes[code];
                let args = [];

                for (let i = 0; i < instruction.argCount; i++) {
                    args.push(this.readMemory(this.$current++));
                }

                if (this.$executing === 0x1571)
                {
                    // Fake validation
                    this.$registers.A = 6;
                    // And skip actuall call to validation function
                    // The right H register value is 
                }
                else
                {
                    let willCallback = instruction.fn(...args);
                    if (willCallback === true)
                        return;
                }

                if (this.$debugging)
                {
                    ui.updateAll();
                    break;
                }
            }
        },
        execute: function () {
            this.$current = 0;
            this.resume();
        },
        readMemory: function (addr) {
            // No need to force the Orb's weight to be 30

            //    if (addr === 3952)
            //        return 30;

            addr <<= 1; // 2 bytes per address
            let lo = this.$memory[addr];
            let hi = this.$memory[addr + 1];

            let value = (hi << 8) | lo;

            return value; 
        },
        writeMemory: function (addr, value) {
            // No need to force the Orb's weight to be 30

            // if (addr === 3952)
            // {                
            //     value = 30;
            //     this.$registers.A = 30;
            // }

            addr <<= 1; // 2 bytes per address
            let lo = value & 0xFF;
            let hi = (value >> 8) & 0xFF;

            this.$memory[addr] = lo;
            this.$memory[addr + 1] = hi;
        },
        setRegister: function (register, value) {
            let reg = getRegisterName(register);

            if (typeof (value) !== "number")
                throw "Invalid Argument";

            value = value & 0x7FFF;
            let old = this.$registers[reg] || 0;
            if (old !== value)
                ui.updateRegister(reg, value);
            this.$registers[reg] = value;
        },
        getValue: function (arg1) {
            if (typeof (arg1) !== "number")
                throw "Invalid Argument";

            if (arg1 >= 0 && arg1 <= 32767)
                return arg1;

            let reg = getRegisterName(arg1);

            if (reg === 'H')
            {
                if (this.$hCount++ >= 2)
                    return 25734;
            }
            
            return this.$registers[reg] || 0;
        }
    };

    ui.updateRegisters = function() {
        // let value = null;
        // let first = 'A'.charCodeAt(0);
        // for(let i = 0; i < 8; i++)
        // {
        //     let k = String.fromCharCode(first+i);

        //     if (value != null)
        //         value += '  ';
        //     else
        //         value = '';
        //     let v = vm.$registers[k] || 0;
        //     value += '{bold}' + k + '{/bold}: ' + globals.asHexa(v, 4);
        // }

        // ui.registers.setContent(value);
        // ui.render(true);
    }

    function addOpcode(argCount, fcnt) {
        vm.$opcodes.push({
            argCount: argCount,
            fn: fcnt
        });
    }

    // halt
    addOpcode(0, () => {
        vm.$current = -1;
        process.exit(0);
    });
    // set   
    addOpcode(2, (a, b) => {
        vm.setRegister(a, vm.getValue(b));
    });
    // push
    addOpcode(1, (a) => {
        vm.$stack.push(vm.getValue(a));
    });
    // pop
    addOpcode(1, (a) => {
        if (vm.$stack.length == 0)
            throw "Stack error";

        let v = vm.$stack.pop();
        vm.setRegister(a, v);
    });
    // eq
    addOpcode(3, (a, b, c) => {
        b = vm.getValue(b);
        c = vm.getValue(c);
        vm.setRegister(a, b === c ? 1 : 0);
    });
    // gt
    addOpcode(3, (a, b, c) => {
        b = vm.getValue(b);
        c = vm.getValue(c);
        vm.setRegister(a, b > c ? 1 : 0);
    });
    // jmp
    addOpcode(1, (a) => {
        a = vm.getValue(a);
        vm.$current = a;
    });
    // jt
    addOpcode(2, (a, b) => {
        a = vm.getValue(a);
        b = vm.getValue(b);
        if (a !== 0)
            vm.$current = b;
    });
    // jf
    addOpcode(2, (a, b) => {
        a = vm.getValue(a);
        b = vm.getValue(b);
        if (a === 0)
            vm.$current = b;
    });
    // add
    addOpcode(3, (a, b, c) => {
        b = vm.getValue(b);
        c = vm.getValue(c);
        vm.setRegister(a, b + c);
    });
    // mult
    addOpcode(3, (a, b, c) => {
        b = vm.getValue(b);
        c = vm.getValue(c);
        vm.setRegister(a, b * c);
    });
    // mod
    addOpcode(3, (a, b, c) => {
        b = vm.getValue(b);
        c = vm.getValue(c);
        vm.setRegister(a, b % c);
    });
    // and
    addOpcode(3, (a, b, c) => {
        b = vm.getValue(b);
        c = vm.getValue(c);
        vm.setRegister(a, b & c);
    });
    // or
    addOpcode(3, (a, b, c) => {
        b = vm.getValue(b);
        c = vm.getValue(c);
        vm.setRegister(a, b | c);
    });
    // not
    addOpcode(2, (a, b) => {
        b = vm.getValue(b);
        vm.setRegister(a, ~b);
    });
    // rmem
    addOpcode(2, (a, b) => {
        let addr = vm.getValue(b);
        b = vm.readMemory(addr);
        vm.setRegister(a, b);
    });
    // wmem
    addOpcode(2, (a, b) => {
        let addr = vm.getValue(a);
        vm.writeMemory(addr, vm.getValue(b));
    });
    // call
    addOpcode(1, (a) => {
        vm.$stack.push(vm.$current);
        vm.$current = vm.getValue(a);
    });
    // ret
    addOpcode(0, () => {
        if (vm.$stack.length === 0)
            vm.$current = -1;
        else
            vm.$current = vm.$stack.pop();
    });
    // out
    addOpcode(1, (a) => {
        let v = vm.getValue(a);
        vm.print(v);
    });
    // in
    addOpcode(1, (a) => {
        ui.updateAll();
        vm.read((v) => {
            vm.setRegister(a, v);
            vm.resume();
        });
        return true;
    });
    // noop
    addOpcode(0, () => {});

    return vm;
});