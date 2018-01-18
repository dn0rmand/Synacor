module.exports = (function()
{    
    const vm     = require("./vm.js");
    const input  = require('./input.js');
    const output = require('./output.js');

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    }

    const fs        = require('fs');    
    const $didPrint = output.didPrint;
    const $didRead  = input.didRead;
    const $willRead = input.willRead;
    const $exit     = process.exit;

    const ROOM       = 1;
    const OBJECTS    = 2;
    const EXITS      = 3;
    const INVENTORY  = 4;
    const NONE       = 0;

    let rooms        = {};
    let ids          = {};
    let nextId       = 1;
    let status       = NONE;
    let currentRoom  = null;
    let lastRoom     = undefined;
    let previousRoom = undefined;
    let lastDirection= null;

    const MAP_FILE_PATH = 'data/map-v3.json';

    function cleanUpMap()
    {
        let modified = true;
        let needSaving = false;
        let ids = Object.keys(rooms);

        while (modified)
        {
            modified = false;
            for(let i = 0; i < ids.length ; i++)
            {
                let id    = ids[i];
                let room  = rooms[id];
                if (room.deadEnd === true)
                    continue;

                let isDead = true;
                let exits = Object.keys(room.exits);
                for (let e = 0; e < exits.length; e++)
                {
                    let k = room.exits[exits[e]];
                    if (k === 0)
                    {
                        isDead = false;
                        break;
                    }
                    let r = rooms[k];
                    if (r.deadEnd !== true)
                    {
                        isDead = false;
                        break;
                    }
                }
                if (isDead)
                {
                    room.deadEnd = true;
                    modified = true;
                    needSaving = true;
                }
            }        
        }

        return needSaving;
    }

    function saveMap() 
    {
        cleanUpMap();

        let map = {
            rooms: rooms,
            ids: ids,
            nextId: nextId
        };

        fs.writeFileSync(MAP_FILE_PATH, JSON.stringify(map));        
    }

    function loadMap() 
    {
        let map = undefined;

        if (fs.existsSync(MAP_FILE_PATH))
        {
            let json = fs.readFileSync(MAP_FILE_PATH);    

            map  = JSON.parse(json);
        }

        if (map !== undefined)
        {
            rooms = map.rooms;
            nextId= map.nextId;
            ids = map.ids;

            if (cleanUpMap())
                saveMap();
        }
    }

    function trace(message) 
    {
        console.log('## ' + message);
    }

    process.exit = function(code) 
    {
        if (lastRoom !== undefined)
        {
            let r = rooms[lastRoom];
            r.deadEnd = true;
        }
        saveMap();
    
        $exit(code);
    }

    function makeId(room)
    {
        return '_' + vm.readMemory(2732);
    }

    function getNextDirection()
    {
        let current = lastRoom === undefined ? undefined : rooms[lastRoom];
        if (current === undefined)
            throw "In a room that doesn't exist";

        // Find not used direction

        let exits = Object.keys(current.exits);
        
        if (exits.length === 0) // No exits???
            throw "Dead end ... no exit";

        // get non-visited rooms    
        let notVisited = exits.filter(exit => {
            let room = current.exits[exit];
            return room === 0;
        });

        if (notVisited.length > 0)
        {
            if (notVisited.length === 1 && notVisited[0] === current.lastTried)
                notVisited = null;
            else
                exits = notVisited;
        }        

        if (notVisited == null)
        {
            // get visited and not dead-end rooms    
            let visited = exits.filter(exit => {
                let room = current.exits[exit]; 
                return (room !== 0 && rooms[room].deadEnd !== true);
            });
            if (visited.length === 0)
                return exits[0]; // Take first one and die!!!
            exits = visited;
        }

        // pick randomly but try to use a different from the last time
        
        do
        {
            let x = getRandomInt(0, exits.length);
            exit = exits[x];  
        }
        while (exits.length > 1 && exit === current.lastTried);

        current.lastTried = exit;      
        return exit;
    }

    input.willRead = function()
    {        
        $willRead();

        if (currentRoom != null)
        {
            let current = currentRoom;

            currentRoom      = null;
            current.id       = makeId(current);
            previousRoom     = lastRoom;
            lastRoom         = current.id;

            if (lastDirection != null && previousRoom !== undefined)
            {
                let p = rooms[previousRoom];
                p.exits[lastDirection] = lastRoom;
                lastDirection = null;
            }

            let old = rooms[current.id];
            if (old !== undefined)
            {
                trace("Already visited");
            }
            else
            {
                rooms[current.id] = current;
            }
        }
        status = NONE;

        if (! input.hasInput())
        {
            let direction = getNextDirection();
            input.addCommand('go ' + direction);
        }
    }
    
    input.didRead = function(command)
    {
        $didRead(command);

        if (command === "go inside")
        {
            input.addCommand("use teleporter");
            return;
            // lastRoom = undefined; // prevent setting deadEnd
            // process.exit(0);
        }        

        if (command.startsWith('go '))
        {
            let direction = command.substring(3).trim();
            lastDirection = direction;
        }
        else
        {
            switch (command)
            {
                case 'save map':
                    saveMap();
                    break;
                case 'halt':
                    lastRoom = undefined; // prevent setting deadEnd
                    process.exit(0);
                    break;
            }
        }
    }

    output.didPrint = function(output)
    {
        $didPrint(output);
        
        if (output === '')
        {
            if (status !== ROOM) // There might be multiple rows in the description
                status = NONE;
        }
        else if (output === "I don't understand; try 'help' for instructions.")
        {
            input.addCommand('look');
        }
        else if (output.startsWith('=='))
        {
            let name = output.replace(/==/g, '').trim();
            status = ROOM;
            currentRoom = {
                name: name,
                description: [],                
                exits: {}
            };
        }
        else if (output === 'Your inventory:')
        {
            status = INVENTORY;
        }
        else if (output === 'Things of interest here:')
        {
            status = OBJECTS;
        }
        else if (output.match(/There (is|are) \d+ exits?:/g))
        {
            status = EXITS;
        }
        else if (output.startsWith('- '))
        {
            switch (status)
            {
                case OBJECTS:
                    if (currentRoom == null)
                        throw "Current Room not set!";

                    if (currentRoom.objects === undefined)
                        currentRoom.objects = [];
                    let object = output.substring(2).trim();
                    currentRoom.objects.push(object);
                    input.addCommand("take " + object);
                    if (object.indexOf("coin") < 0)
                    {
                        input.addCommand("use " + object);
                        if (object === "can")
                            input.addCommand("use lantern");
                    }
                    break;
                case EXITS:
                    if (currentRoom == null)
                        throw "Current Room not set!";
                    let exit = output.substring(2).trim();
                    currentRoom.exits[exit] = 0;
                    break;
            }
        }
        else if (status === ROOM)
        {
            currentRoom.description.push(output);
        }
    }

    loadMap();

    return 'map-engine-loaded';
})();
