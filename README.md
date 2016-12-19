[![capstring](https://img.shields.io/badge/CaPiTaLiZe-StRiNgS!-brightgreen.svg)](https://github.com/brianfunk/capstring)
[![GitHub](https://img.shields.io/github/release/brianfunk/capstring.svg?maxAge=2592000)](https://github.com/brianfunk/capstring)
[![npm](https://img.shields.io/npm/v/capstring.svg?maxAge=2592000)](https://www.npmjs.com/package/capstring)
[![Code Climate](https://codeclimate.com/github/brianfunk/capstring/badges/gpa.svg)](https://codeclimate.com/github/brianfunk/capstring)
[![codecov](https://codecov.io/gh/brianfunk/capstring/branch/dev/graph/badge.svg)](https://codecov.io/gh/brianfunk/capstring)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/fe13d389817449bbabbf851867226408)](https://www.codacy.com/app/bfunk/capstring)
[![bitHound Overall Score](https://www.bithound.io/github/brianfunk/capstring/badges/score.svg)](https://www.bithound.io/github/brianfunk/capstring)
[![TravisCI](https://travis-ci.org/brianfunk/capstring.svg?branch=dev)](https://travis-ci.org/brianfunk/capstring)
[![Dependency Status](https://www.versioneye.com/user/projects/57dde680bf3e4c0034e21e94/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/57dde680bf3e4c0034e21e94)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badge/)
[![Semver](https://img.shields.io/badge/SemVer-2.0-blue.svg)](http://semver.org/spec/v2.0.0.html)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)](https://opensource.org/licenses/MIT)
[![LinkedIn](https://img.shields.io/badge/Linked-In-blue.svg)](https://www.linkedin.com/in/brianrandyfunk)

# capstring

CaPiTaLiZe StRiNgS!

## Install

    npm install capstring --save
    
## Usage

    var capstring = require('capstring');
    
    capstring(string, cap);

## Values

Valid capitalization options:

+ title
+ sentence
+ upper
+ lower
+ same
+ none
+ proper
+ camel
+ pascal
+ snake
+ python
+ crazy
+ random
+ leet
+ reverse

## Examples

    capstring('hello WORLD', 'title');  // returns 'Hello World'
    capstring('hello WORLD', 'sentence');  // returns 'Hello world'
    capstring('hello WORLD', 'upper');  // returns 'HELLO WORLD'
    capstring('hello WORLD', 'lower');  // returns 'hello world'
    
## Tests
    
    npm test
    
## Coverage

    npm run coverage
    
## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on the code of conduct and the process for submitting pull requests.

## Versioning

This application is maintained under [the Semantic Versioning 2.0 guidelines](http://semver.org/spec/v2.0.0.html).

## Copyright and license

Code and documentation copyright 2016 Brian Funk. Code released under [the MIT license](https://opensource.org/licenses/MIT).

### # " "
