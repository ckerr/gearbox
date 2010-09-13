
Array.prototype.lowerBound = function(needle, compare)
{
  var first = 0,
      exact = false,
      nmemb = this.length;

  while( nmemb != 0 )
  {
      var half = Math.floor( nmemb / 2 ),
          middle = first + half,
          c = compare( needle, this[middle] );

      if( c <= 0 ) {
          if( c == 0 )
              exact = true;
          nmemb = half;
      } else {
          first = middle + 1;
          nmemb = nmemb - half - 1;
      }
  }

  return { index: first, match: exact };
};

/**
 * Given a numerator and denominator, return a ratio string
 */
Math.ratio = function( numerator, denominator )
{
    var result = Math.floor(100 * numerator / denominator) / 100;
    //check for special cases
    if(result==Number.POSITIVE_INFINITY || result==Number.NEGATIVE_INFINITY) result = -2;
    else if(isNaN(result)) result = -1;
    return result;
};

/**
 * Truncate a float to a specified number of decimal
 * places, stripping trailing zeroes
 *
 * @param float floatnum
 * @param integer precision
 * @returns float
 */
Math.truncateWithPrecision = function(floatnum, precision) {
        return Math.floor( floatnum * Math.pow ( 10, precision ) ) / Math.pow( 10, precision );
};

/**
 * Round a string of a number to a specified number of decimal
 * places
 */
Number.prototype.toTruncFixed = function( place ) {
        var ret = Math.truncateWithPrecision( this, place );
        return ret.toFixed( place );
}

function getHost( uri )
{
    var host = uri.host;
    var p = host.split('.');
    if( p.length >= 2 )
        return p[p.length-2] + '.' + p[p.length-1];
    else
        return host;
}

function getNameFromHost( domain )
{
    var pos = domain.lastIndexOf('.'),
        name = pos==-1 ? domain : domain.slice(0,pos);
    return Ext.util.Format.capitalize(name);
}

/**
 * http://blog.stevenlevithan.com/archives/parseuri
 *
 * parseUri 1.2.2
 * (c) Steven Levithan <stevenlevithan.com>
 * MIT License
 */
function parseUri (str) {
	var	o   = parseUri.options,
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};

parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};
