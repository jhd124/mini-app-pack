"use strict";
exports.__esModule = true;
var fs = require("fs-extra");
var path_1 = require("path");
function resolveUserModuleImportPath(filePath, moduleImportPath) {
    var dir = path_1.parse(filePath).dir;
    console.log(dir)

    var isModuleImportPathAbsolute = path_1.isAbsolute(moduleImportPath);
    if (isModuleImportPathAbsolute) {
        return moduleImportPath;
    }
    else {
        return path_1.join(dir, moduleImportPath);
    }
}
exports.resolveUserModuleImportPath = resolveUserModuleImportPath;
function readFileSync(filePath) {
    return fs.readFileSync(filePath, { encoding: "UTF8" });
}
exports.readFileSync = readFileSync;
//# sourceMappingURL=helper.js.map