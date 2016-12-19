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

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

//*******************************************************************

var capstring = require('../index.js');

//*******************************************************************

describe('capstring', function() {
  
	it('should return string', function() {
		expect( capstring('hello world') ).to.be.a('string');
	});

	it('should not be a number', function() {
		expect( capstring('hello world') ).to.not.be.a('number');
	});

	it('should be boolean if not a string', function() {
		expect( capstring(123) ).to.be.a('boolean');
	});

	it('should be false if not a string', function() {
		expect( capstring(123) ).to.be.false;
	});
    
	it('should be false if typeof not a string', function() {
		expect( capstring(false) ).to.be.false;
	});
	
    it('default should be same case', function() {
		expect( capstring('HELLO world') ).to.equal('HELLO world');
	});
    
    it('should be same case', function() {
		expect( capstring('HELLO world', 'same') ).to.equal('HELLO world');
	});
    
    it('should be same if proper case', function() {
		expect( capstring('HELLO world', 'proper') ).to.equal('HELLO world');
	});
    
    it('should be no case', function() {
		expect( capstring('HELLO world', 'none') ).to.equal('');
	});
    
	it('should be lower case', function() {
		expect( capstring('HELLO WORLD', 'lower') ).to.equal('hello world');
	});
	
	it('SHOULD BE UPPER CASE', function() {
		expect( capstring('hello world', 'upper') ).to.equal('HELLO WORLD');
	});
	
	it('shouldBeCamelCase', function() {
		expect( capstring('hello world', 'camel') ).to.equal('helloWorld');
	});
	
	it('ShouldBePascalCase', function() {
		expect( capstring('hello world', 'pascal') ).to.equal('HelloWorld');
	});
    
    it('Should Be Title Case', function() {
		expect( capstring('hello world', 'title') ).to.equal('Hello World');
	});
    
    it('Should be sentence case', function() {
		expect( capstring('hello world', 'sentence') ).to.equal('Hello world');
	});
    
    it('should_be_snake_case', function() {
		expect( capstring('hello world', 'snake') ).to.equal('hello_world');
	});
    
    it('SHOULD_BE_PYTHON_CASE', function() {
		expect( capstring('hello world', 'python') ).to.equal('HELLO_WORLD');
	});
    
    it('ShOuLd bE CrAzY', function() {
		expect( capstring('hello world', 'crazy') ).to.equal('hElLo wOrLd');
	});
    
    it('ShOuLd be RANDOM?', function() {
		expect( capstring('hello world', 'random') ).to.be.a('string');
	});
    
    it('$h0uld be l33t', function() {
		expect( capstring('hello WORLD of Interwebs', 'leet') ).to.equal('h3££0 w0r£d 0ƒ 1Иt3rw3b$');
	});
    
    it('should be same if not valid cap type', function() {
		expect( capstring('hello world', 'other') ).to.equal('hello world');
	});
  
});

//*******************************************************************

