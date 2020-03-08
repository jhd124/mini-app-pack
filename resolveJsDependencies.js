"use strict";
exports.__esModule = true;
var fs = require("fs-extra");
var parser_1 = require("@babel/parser");
var traverse_1 = require("@babel/traverse");
var path_1 = require("path");
var helper_1 = require("./helper");
var cwd = process.cwd();
var SRC_DIR = path_1.join(cwd, "src");
function getAst(path) {
    var code = fs.readFileSync(path, "utf8");
    var ast = parser_1.parse(code, {
        sourceType: "module"
    });
    return ast;
}
function resolveJsDependencies(filePath) {
    var ast = getAst(filePath);
    var dir = path_1.parse(filePath).dir;
    var dependencyMap = {};
    traverse_1["default"](ast, {
        CallExpression: function (path) {
            if (path.node.callee.name === "require") {
                var depPath = path.node.arguments[0].value;
                dependencyMap[depPath] = depPath;
            }
        },
        ImportDeclaration: function (path) {
            var depPath = path.node.source.value;
            dependencyMap[depPath] = depPath;
        }
    });
    var depPaths = Object.values(dependencyMap);
    var npmDepPaths = depPaths.filter(function (depPath) { return recogniseNpm(depPath); });
    var userModulePaths = depPaths
        .filter(function (depPath) { return !recogniseNpm(depPath); })
        .map(function (depPath) { return helper_1.resolveUserModuleImportPath(filePath, depPath); });
    return {
        userModulePaths: userModulePaths,
        npmPaths: npmDepPaths
    };
}
exports.resolveJsDependencies = resolveJsDependencies;
function recogniseNpm(filePath) {
    var regExp = /^\.|^\//;
    return regExp.test(filePath);
}
//# sourceMappingURL=resolveJsDependencies.js.map