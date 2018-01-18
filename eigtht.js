
const createMemoize = function() 
{
    let mem = {
        get: function(A, B)
        {
            let k = A+','+B;
            let r = this[k];
            return r;
        },
        set: function(A, B, value)
        {
            let k = A+','+B;
            this[k] = value;
        }
    }

    return mem;
};

let memoize;

function validate(A, B, H) // 4, 1, ?
{
    if (A === 0) 
        return (B+1) & 0x7FFF;

    let result;

    result = memoize.get(A, B);
    if (result !== undefined)
        return result;

    if (B == 0)
    {
        result = validate( (A-1) & 0x7FFF, H, H);
    }
    else
    {
        let B2 = validate(A, (B-1) & 0x7FFF, H);
        result = validate((A-1) & 0x7FFF, B2, H);
    }

    memoize.set(A, B, result);
    return result;
}

function calculate(H)
{
    memoize = createMemoize();

    let result = validate(4,1, H);
    process.stdout.write('\r' + H + ' -> ' + result + '  ');
    return result;
}

for(var h = 5562; h < 0x8000 ; h++)
{
    let result = calculate(h);

    if (result == 6)
    {
        console.log("Found it ... " + h);
        break;
    }
    if (typeof(result) != "number")
        console.log('You might want to restart from scratch!');
}

process.exit();