const path = require('path');

const basePath = "c:/Users/pc/Desktop/G7V0101/GAI";
const absolutePath = "C:/Users/pc/Desktop/G7V0101/GAI/modes/A1/ComplexDemo.sfc";

const relative = path.relative(basePath, absolutePath);
console.log('Relative path (C vs c):', relative);
console.log('Normalized (C vs c):', relative.replace(/\\/g, '/'));
console.log('Starts with ..?', relative.startsWith('..'));
console.log('Is absolute?', path.isAbsolute(relative));
