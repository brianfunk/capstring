/*
   ___      ___    _____   ___ _  _      
  / __|__ _| _ \__|_   _| |_ _| \| |__ _ 
 | (__/ _` |  _(_-< | || '_| || .` / _` |
  \___\__,_|_| /__/ |_||_||___|_|\_\__, |
                                   |___/ 
*/

//*******************************************************************

'use strict';


//*******************************************************************

var cap = function(str,c) {

    var nstr;
    
	if (c === 'same') {		
		return str;
	}
    else if (c === 'none') {		
		return '';
	}
    else if (c === 'proper') {		
		return str;
	}
    else if (c === 'title') {		
		return str.replace(/\w([^-\s]*)/g, function(txt){
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
	}
	else if (c === 'upper') {
		return str.toUpperCase();
	}
	else if (c === 'lower') {
		return str.toLowerCase();
	}
    else if (c === 'camel') {
		nstr = str.replace(/\w([^-\s]*)/g, function(txt){
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }).replace(/ /g, '');
        return nstr.charAt(0).toLowerCase() + nstr.substr(1);
	}
    else if (c === 'pascal') {
        return str.replace(/\w([^-\s]*)/g, function(txt){
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }).replace(/ /g, '');
	}
    else if (c === 'sentence') {
		return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
	}
    else if (c === 'snake') {
		return str.replace(/ /g, '_');
	}
    else if (c === 'python') {
		return str.toUpperCase().replace(/ /g, '_');
	}
    else if (c === 'crazy') {
		nstr = '';
        for (var i = 0; i < str.length; i++){
            if (i % 2 === 0) {
                nstr += str.charAt(i).toLowerCase();
            }
            else {
                nstr += str.charAt(i).toUpperCase();
            }
        }
        return nstr;
	}
    else if (c === 'random') {
        nstr = '';
        for (var i = 0; i < str.length; i++){
            
            var rnd = Math.random();
            
            if (rnd > 0.5) {
                nstr += str.charAt(i).toLowerCase();
            }
            else {
                nstr += str.charAt(i).toUpperCase();
            }
        }
        return nstr;
	}
	else{
		return str;
	}
};

//*******************************************************************

var string = function(s, opt) {
	
	if (!s) {
		console.error('s isNaN : ' + s);
		return false;
	}
	else if (typeof s !== 'string') {
		console.error('s typeof : ' + s);
		return false;
	}
	else {			
		
		if (opt) {		
            s = cap(s, opt);				
		}
        else {
            s = cap(s, 'same');	
        }
		
		return s;
	}
};

//*******************************************************************

module.exports = string;
