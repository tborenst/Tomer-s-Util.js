/**
 * util.js
 * Includes a lot of really helpful functions.
 ***/

var Util = {};

//=======================//
// FUNCTION MANIPULATION //
//=======================//

Util.functionToText = function(fn){
	var string = fn.toString();
	var indexStart = string.indexOf("{") + 1;
	string = string.slice(indexStart);                     // remove 'function(){'
	string = string.substring(0, string.length-1); // remove '}'
	return string;
}

Util.textToFunction = function(text){
	return (new Function(text));
}

//=================//
//   EVENT QUEUE   //
//=================//

/**
 * Util.pushOntoEventQueue
 * Pushes a given function onto the javascript event queue.
 ***/
Util.pushOntoEventQueue = function(fn){
	setTimeout(fn, 0);
}

//================//
//     ARRAYS     //
//================//

/**
 * Util.isArray
 * Returns true if object is an array, false otherwise.
 ***/
Util.isArray = function(obj){
 	try{
 		return (Object.prototype.toString.call(obj) === "[object Array]");
 	} catch(e) {
 		return false;
 	}
}

/**
 * Util.isInArray
 * Returns true if object is in the array, false otherwise.
 ***/
Util.isInArray = function(obj, array){
	return !(array.indexOf(obj) < 0)
}

/**
 * Util.removeFromArray
 * Removes object from array.
 ***/
Util.removeFromArray = function(obj, array){
	var index = array.indexOf(obj);
	if(index < 0){
		return;
	} else {
		array.splice(index, 1);
	}
}

/**
 * Util.argumentsToArray
 * Returns an array version of an 'arguments' array-like object.
 ***/
Util.argumentsToArray = function(args){
	var array = [];
	for(var i = 0; i < args.length; i++){
		array.push(args[i]);
	}
	return array;
}

/**
 * Util.arrayIntersection
 * Takes in a variable number of arrays, where objects are unique within an
 * array, and returns the intersection of all of those arrays.
 ***/
// TODO: there's a better way that works with non-unique objects
// TODO: change this to use arrays so it's clean
Util.arrayIntersection = function(/* arr0, arr1, ..., arrN */){
	var numOfArrays = arguments.length;
	var objects = {}; // key - object, value - array of its copies
	                  // note: this is a necessary hack because
	                  // for ... in turns keys into strings

	// count how many times every unique object appears in an array
	for(var arg in arguments){
		var array = arguments[arg];
		if(array.length === 0){
			return [];
		}

		for(var i = 0; i < array.length; i++){
			var obj = array[i];
			if(obj in objects){
				objects[obj].push(obj);
			} else {
				objects[obj] = [obj];
			}
		}
	}

	// push objects that appeared in *all* arrays into result
	var result = [];
	for(var obj in objects){
		var arrayOfAppearances = objects[obj];
		if(numOfArrays <= arrayOfAppearances.length){
			result.push(arrayOfAppearances[0]);
		}
	}

	return result;
}

//=================//
// OBJECT ORIENTED //
//=================//

/**
 * Util.extend
 * Makes Child inherit methods from Parent and adds a "super" field to Child's
 * prototype, pointing to the Parent's prototype.
 ***/
Util.extend = function(Child, Parent){
	Child.prototype = new Parent();
	Child.prototype.constructor = Child;
	Child.prototype.super = Parent.prototype;
}

//===============//
//     MATHS     //
//===============//

/**
 * Util.greaterThanByMore
 * Returns true if a is greater than b by more than n.
 ***/
Util.greaterThanBy = function(a, b, n){
	var result = a - b;
	if(result < 0){
		return false;
	} else if(result <= n){
		return false;
	} else {
		return true;
	}
}

/**
 * Util.lessThanBy
 * Does the opposite of Util.greaterThanBy()
 ***/
Util.lessThanBy = function(a, b, n){
	var result = a - b;
	if(result > 0){
		return false;
	} else if(Math.abs(result) < n){
		return false;
	} else {
		return true;
	}
}

/**
 * Util.inBounds
 * Returns true if the test value is within the given bounds, and false 
 * otherwise.
 ***/
Util.inBounds = function(bound1, bound2, testValue){
	var min = Math.min(bound1, bound2);
	var max = Math.max(bound1, bound2);
	if(min <= testValue && testValue <= max){
		return true;
	} else {
		return false;
	}
}

/**
 * Util.sign
 * Returns the sign of a number: -1, 0 or +1
 ***/
 Util.sign = function(num){
 	if(num === 0){
 		return 0;
 	} else if(num < 0){
 		return -1;
 	} else {
 		return +1;
 	}
 }

//===============//
//     OTHER     //
//===============//

/**
 * Util.throwError
 * Throws an error.
 ***/
Util.throwError = function(msg){
	throw ("Error: " + msg);
}

/**
 * Util.dumpToScope
 * Takes an object and a scope, then dumps all items in the object into scope.
 ***/
Util.dumpToScope = function(obj, scope){
	for(var key in obj){
		scope[key] = obj[key];
	}
}

/**
 * Util.globalize
 * Adds object to global variable GLOBAL, or creates it if it doesn't exist.
 ***/
Util.globalize = function(key, value){
	if(window.GLOBAL === undefined){
		window.GLOBAL = {};
	}
	window.GLOBAL[key] = value;
}

/**
 * Util.include
 * Lets you include javascript files from one to another, and execute a callback
 * when the files are finished loading.
 * Argument is a single file path, or an array of file paths.
 ***/
Util.include = (function(){
	var files = {};        // key - path, val - bool
	var count = 0;         // count of included files
	var UID   = 0;         // unique id for callbacks
	var dependencies = {}; // key - path, val - array of depended files

	var includeFile = function(filepath, callback){
		if(files[filepath] !== undefined){
			var wait = function(){
				if(files[filepath] === false){
					// still loading
					Util.pushOntoEventQueue(wait);
				} else {
					// file is ready
					callback();
				}
			}
			// wait for the file to finish loading
			wait();
		} else {
			// adding a new file
			files[filepath] = false;
			count++;

			// add new file as dependency for all other waiting files
			for(var DPID in dependencies){
				dependencies[DPID].push(filepath);
			}

			// unique ID for callback
			var ID = UID++;
			dependencies[ID] = [];
			var loadCallback = function(){
				for(var i = 0; i < dependencies[ID].length; i++){
					var file = dependencies[ID][i];
					if(files[file] !== true){
						// file is still waiting on other files
						Util.pushOntoEventQueue(loadCallback);
						return;
					}
				}

				// all other files have finished loading
				files[filepath] = true;
				callback();
			}

			// create script tag and add to the DOM
			var script = document.createElement("script");
			script.src = filepath;
			script.onload = function(){
				Util.pushOntoEventQueue(loadCallback);
			}
			document.body.appendChild(script);
		}
	}

	// a wrapper that lets you pass in an array of files as well
	var include = function(files, callback){
		if(Util.isArray(files)){

			var sliceAndInclude = function(){
				if(files.length === 1){
					includeFile(files[0], callback);
				} else {
					var file = files[0];    // retrieve first file
					files = files.slice(1); // slice it off the rest 
					includeFile(file, sliceAndInclude);
				}
			}

			sliceAndInclude();
		} else {
			includeFile(files, callback);
		}

	}

	return include;
})();

/**
 * Util.browser
 * Returns {chrome: bool, firefox: bool, safari: bool, other: bool}.
 * Utilizes code from http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
 ***/
Util.browser = function(){
	var name = (function(){
	    var ua= navigator.userAgent, tem, 
	    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
	    if(/trident/i.test(M[1])){
	        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
	        return 'IE '+(tem[1] || '');
	    }
	    if(M[1]=== 'Chrome'){
	        tem= ua.match(/\bOPR\/(\d+)/)
	        if(tem!= null) return 'Opera '+tem[1];
	    }
	    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
	    if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
	    return M.join(' ');
	})();
	name = name.toLowerCase();

	var result = {chrome: false, firefox: false, safari: false, other: false};
	if(name.indexOf("chrome") !== -1){
		result.chrome = true;
	} else if(name.indexOf("firefox")){
		result.firefox = true;
	} else if(name.indexOf("safari")){
		result.safari = true;
	} else {
		result.other = true;
	}

	return result;
}