"use strict";
exports.__esModule = true;
var cheerio = require("cheerio");
function resolveWxmlDependencies(filePath) {
    var $ = cheerio.load('<wxs src="./asdf.wxs" class="title"/><wxs src="./abcdefg"></wxs><wxs></wxs>');
    console.log(Array.from($("wxs")).map(elem => elem.attribs.src));
}
//# sourceMappingURL=resolveWxsDependencies.js.map
resolveWxmlDependencies();