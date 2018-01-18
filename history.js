module.exports = (function()
{    
    const input = require('./input.js');
    const fs    = require('fs');    

    const $didRead  = input.didRead;

    let history = [];

    const HISTORY_FILE_PATH = 'data/history.json';

    function loadHistory()
    {
        if (fs.existsSync(HISTORY_FILE_PATH))
        {
            let h = fs.readFileSync(HISTORY_FILE_PATH);
            h = JSON.parse(h);    
            for(let i = 0; i < h.history.length; i++) 
                input.addCommand(h.history[i]);   
        }
    }
    
    function saveHistory()
    {
        fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify({ history: history }));        
    }

    input.didRead = function(command)
    {
        $didRead(command);

        switch (command)
        {
            case 'save history':
                saveHistory();
                break;
            case "halt":
                process.exit();
                break;
            default:
                history.push(command);
                break;
        }
    }

    loadHistory();

    return history;
});
