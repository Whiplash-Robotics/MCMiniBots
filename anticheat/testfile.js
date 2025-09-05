
import React from 'react'; // Allowed
import fs from 'fs'; // Disallowed!
import path from 'path'; // Disallowed!

const _ = require('lodash'); // Allowed
const os = require('os'); // Disallowed!

function dangerous() {
    eval("console.log('pwned')"); // Disallowed!
}

const mylib = 'fs';
const a = 'require';
global[a](mylib); // Disallowed dynamic require!
