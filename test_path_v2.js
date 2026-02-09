const path = require('path');

function getRelativePath(basePath, absolutePath) {
    const normalize = (p) => p.replace(/\\/g, '/');
    const normalizedBase = normalize(basePath);
    const normalizedTarget = normalize(absolutePath);

    if (!path.isAbsolute(absolutePath)) {
        return normalizedTarget;
    }

    const relative = path.relative(normalizedBase, normalizedTarget);
    return relative.replace(/\\/g, '/');
}

const basePath = "c:/Users/pc/Desktop/G7V0101/GAI";
const absolutePath = "c:\\Users\\pc\\Desktop\\G7V0101\\GAI\\modes\\A1\\ComplexDemo.sfc";

console.log('Result:', getRelativePath(basePath, absolutePath));
