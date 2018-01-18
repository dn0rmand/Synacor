let map = 
[
    [ '*' ,   8 , '-' ,   1 ],
    [   4 , '*' ,  11 , '*' ],
    [ '+' ,   4 , '-' ,  18 ],
    [  22 , '-' ,   9 , '*' ]
];

let moves = [
    [ 0, 1, 'south'],
    [ 0,-1, 'north'],
    [ 1, 0, 'east'],
    [-1, 0, 'west']
];

let visited = {};
let shortest = 15;
let shortestPath = "not found";

function FindShortestPath(currentX, currentY, currentValue, path)
{
    function isDestination() { return currentX == 3 && currentY == 0; }
    function isOrigin() { return currentX == 0 && currentY == 3; }

    let count = path.length;

    if (count > shortest || currentValue < 0)
        return;

    if (isOrigin() && count != 0)
        return; // Invalid to go back

    if (isDestination() && currentValue == 30)
    {
        shortest     = count;
        shortestPath = '"' + path.join('",\n"') + '"';
        return;
    }

    if (isDestination() && currentValue != 30) // Bad!
        return;

    let k = currentX + "," + currentY + "," + currentValue;
    let v = visited[k];
    if (v === undefined)
        visited[k] = count;
    else if (v > count)
        visited[k] = count;
    else
        return; // no point going further this way

    let value = map[currentY][currentX];
    let isOp  = typeof(value) === 'string';
    moves.forEach( move => 
    {
        let newX = currentX + move[0];
        let newY = currentY + move[1];
        if (newX < 0 || newX > 3 || newY < 0 || newY > 3)
            return; // Not a valid move

        let v = map[newY][newX];
        let newValue = currentValue;

        if (isOp)
        {
            switch(value)
            {
                case '+':
                    newValue = currentValue + v; break;
                case '-':
                    newValue = currentValue - v; break;
                case '*':
                    newValue = currentValue * v; break;
                default:
                    throw "Not a valid operator";
            }
        }

        path.push(move[2])
        FindShortestPath(newX, newY, newValue, path);
        path.pop();
    });
}

FindShortestPath(0, 3, 22, []);
console.log('Done');
console.log(shortestPath);