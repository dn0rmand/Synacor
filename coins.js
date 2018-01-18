module.exports = (function()
{    
    const fs     = require('fs');    
    const input  = require('./input.js');
    const output = require('./output.js');

    input.addCommand("go south");
    input.addCommand("go north"); 
    input.addCommand("take tablet"); 
    input.addCommand("use tablet");
    input.addCommand("go doorway"); 
    input.addCommand("go north");
    input.addCommand("go north");
    input.addCommand("go bridge");
    input.addCommand("go continue"); 
    input.addCommand("go down");
    input.addCommand("go east");
    input.addCommand("take empty lantern");
    input.addCommand("go west");
    input.addCommand("go west");
    input.addCommand("go passage"); 
    input.addCommand("go ladder"); 
    input.addCommand("go west");
    input.addCommand("go south");
    input.addCommand("go north");
    input.addCommand("take can"); 
    input.addCommand("use can");
    input.addCommand("use lantern"); 
    input.addCommand("go west");
    input.addCommand("go ladder");
    input.addCommand("go darkness");
    input.addCommand("go continue");
    input.addCommand("go west");

    const $didPrint = output.didPrint;
    const $didRead  = input.didRead;

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    }

    // Code to try all possible combinaison of coins

    let combinaisons = { };
    //"red coin", "shiny coin", "corroded coin", "concave coin", "blue coin"
    let coins = [  ];

    combinaisons[coins.join(',')] = 1;

    function shuffleCoins()
    {
        do 
        {
            let c = coins ;
            coins = [];
    
            while(c.length > 0)
            {
                let i = getRandomInt(0, c.length);
                let coin = c[i];
                coins.push(coin);
                c.splice(i,1);
            }
            let key = coins.join(',');
            if (combinaisons[key] === undefined)
            {
                combinaisons[key] = 1;
                break;
            }
            console.log(key + ' already tried');
        }
        while (1);
    }

    input.didRead = function(command)
    {
        $didRead(command);

        if (command != "take coins")
        {
            if (command.startsWith("take ") && command.indexOf("coin") > 0)
            {
                let c = command.substring(5);
                if (coins.length < 5)
                    coins.push(c);
                return;
            }
        }

        switch (command)
        {
            case 'use coins':
                coins.forEach(c => { input.addCommand('use ' + c)});
                break;
            case 'take coins':
                coins.forEach(c => { input.addCommand('take ' + c)});
                shuffleCoins();
                input.addCommand('use coins');
                break;                
        }
    }

    output.didPrint = function(output)
    {
        $didPrint(output);

        if (output === "As you place the last coin, you hear a click from the north door.")
        {
            input.addCommand("north");
        }
        if (output === "That door is locked.")
        {
            if (coins.length === 5)
                input.addCommand("use coins");
        }
        else if (output === 'As you place the last coin, they are all released onto the floor.')
        {
            // retake all the coins
            input.addCommand('take coins');
        }
    }

    return 'coin-manager-loaded';
})();
