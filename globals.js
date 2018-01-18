if (process.globals === undefined)
{
    process.globals = {
        values: {},

        // 
        get: function(name)
        {
            return this.values[name];
        },
        set: function(name, value)
        {
            this.values[name] = value;
        },
        declare: function(name, constructor)
        {
            let value = this.values[name];
            if (value === undefined)
            {
                value = constructor();
                this.values[name] = value;
            }
            return value;
        },

        // Some common helpers
        asHexa: function(value, length)
        {
            let str = value.toString(16);
            if (typeof(length) === "number")
            {
                while (str.length < length)
                    str = '0' + str;
            }
            return '0x' + str;
        }            
    };
}

module.exports = process.globals;
