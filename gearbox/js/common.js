
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


function parseUri( sourceUri )
{
    var uriPartNames = ["source","protocol","authority","domain","port","path","directoryPath","fileName","query","anchor"];
    var uriParts = new RegExp("^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)?((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?").exec(sourceUri);
    var uri = {};
    
    for(var i = 0; i < 10; i++){
        uri[uriPartNames[i]] = (uriParts[i] ? uriParts[i] : "");
    }
    
    // Always end directoryPath with a trailing backslash if a path was present in the source URI
    // Note that a trailing backslash is NOT automatically inserted within or appended to the "path" key
    if(uri.directoryPath.length > 0){
        uri.directoryPath = uri.directoryPath.replace(/\/?$/, "/");
    }
    
    return uri;
}

function getHost( sourceUri )
{
    var domain = parseUri(sourceUri).domain;
    var p = domain.split('.');
    if( p.length >= 2 )
        return p[p.length-2] + '.' + p[p.length-1];
    else
        return domain;
}

/* parseUri JS v0.1, by Steven Levithan (http://badassery.blogspot.com)
 * Splits any well-formed URI into the following parts (all are optional):
 * ----------------------
 *  • source (since the exec() method returns backreference 0 [i.e., the entire match] as key 0, we might as well use it)
 *  • protocol (scheme)
 *  • authority (includes both the domain and port)
 *  • domain (part of the authority; can be an IP address)
 *  • port (part of the authority)
 *  • path (includes both the directory path and filename)
 *  • directoryPath (part of the path; supports directories with periods, and without a trailing backslash)
 *  • fileName (part of the path)
 *  • query (does not include the leading question mark)
 *  • anchor (fragment)
 */
function parseUri(sourceUri)
{
    var uriPartNames = ["source","protocol","authority","domain","port","path","directoryPath","fileName","query","anchor"];
    var uriParts = new RegExp("^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)?((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?").exec(sourceUri);
    var uri = {};
    
    for(var i = 0; i < 10; i++){
        uri[uriPartNames[i]] = (uriParts[i] ? uriParts[i] : "");
    }
    
    // Always end directoryPath with a trailing backslash if a path was present in the source URI
    // Note that a trailing backslash is NOT automatically inserted within or appended to the "path" key
    if(uri.directoryPath.length > 0){
        uri.directoryPath = uri.directoryPath.replace(/\/?$/, "/");
    }
    
    return uri;
}
