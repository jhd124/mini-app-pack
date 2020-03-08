"use strict";
exports.__esModule = true;
var cheerio = require("cheerio");
var helper_1 = require("./helper");
function resolveWxmlDependencies(filePath) {
    var $ = cheerio.load(helper_1.readFileSync(filePath));
    console.log($("wxs").attr("src"));
    var wxsDependencies = getSrcsFromTag(filePath, $, "wxs");
    var wxmlDependencies = getSrcsFromTag(filePath, $, "wxml");
    return {
        wxsDependencies: wxsDependencies,
        wxmlDependencies: wxmlDependencies
    };
}
function getSrcsFromTag(filePath, cheer, tagName) {
    Array.from(cheer(tagName))
        .map(function (elem) { return elem.attribs.src; })
        .filter(function (depPath) { return !!depPath; })
        .map(function (depPath) { return helper_1.resolveUserModuleImportPath(filePath, depPath); });
}
//# sourceMappingURL=resolveWxmlDependencies.js.map