"use strict";
exports.__esModule = true;
var helper_1 = require("./helper");
var css = require("css");
function resolveWxssDependencies(filePath) {
    var wxssCode = helper_1.readFileSync(filePath);
    var ast = css.parse(wxssCode);
    return ast.stylesheet.rules
        .filter(function (rule) { return rule.type === "import"; })
        .map(function (rule) { return helper_1.resolveUserModuleImportPath(filePath, JSON.parse(rule["import"])); });
}
console.log(resolveWxssDependencies("./src/pages/index.wxss"));
//# sourceMappingURL=resolveWxssDependencies.js.map