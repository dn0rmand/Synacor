const synacor = module.exports = function () 
{
    const fs = require('fs');

    const disassembler = require('./disassembler.js');
    const vm           = require('./vm.js');
    const input        = require('./input.js');
    const output       = require('./output.js');
    const ui           = require('./ui.js');

    //require('./map.js');
    //require('./coins.js');
    //require('./history.js');

    vm.read = input.read;
    vm.print = output.print;

    let inputStream = fs.createReadStream('Data/challenge.bin');

    inputStream
        .on('data', (chunk) => {
            vm.$memory.push(...chunk)
        })
        .on('end', () => {
            ui.updateAll();
            vm.execute();
        });
};

synacor(); // for debugging