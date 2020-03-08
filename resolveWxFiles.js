"use strict";
exports.__esModule = true;
var fs_extra_1 = require("fs-extra");
var path_1 = require("path");
var cwd = process.cwd();
var SRC_DIR = path_1["default"].join(cwd, "src");
function readAppJSON() {
    var appJSONPath = SRC_DIR + "/app.json";
    if (fs_extra_1["default"].pathExistsSync(appJSONPath)) {
        return fs_extra_1["default"].readJSONSync("" + appJSONPath);
    }
    else {
        throw new Error("\n            app.json is not found in " + appJSONPath + "\n            \u8BF7\u786E\u8BA4\u6587\u4EF6" + appJSONPath + "\u5B58\u5728\n        ");
    }
}
var DepType;
(function (DepType) {
    DepType["JS"] = "js";
    DepType["WXML"] = "wxml";
    DepType["WXSS"] = "wxss";
    DepType["JSON"] = "json";
    DepType["WXS"] = "wxs";
})(DepType || (DepType = {}));
var depCollection = (_a = {},
    _a[DepType.JS] = new Map(),
    _a[DepType.WXML] = new Map(),
    _a[DepType.WXSS] = new Map(),
    _a[DepType.JSON] = new Map(),
    _a[DepType.WXS] = new Map(),
    _a);
function setDep(dep) {
    var type = dep.type, path = dep.path, data = dep.data;
    var targetCollection = depCollection[type];
    if (targetCollection.has(path)) {
        var currentData = targetCollection.get(path);
        targetCollection.set(path, currentData.concat([data]));
    }
    else {
        targetCollection.set(path, [data]);
    }
}
function setDeps(deps) {
    for (var _i = 0, deps_1 = deps; _i < deps_1.length; _i++) {
        var dep = deps_1[_i];
        setDep(dep);
    }
}
function getDepsByType(type) {
    return depCollection[type];
}
function getDepCollection() {
    return depCollection;
}
function digAppJSON() {
    var appJSON = readAppJSON();
    var pages = appJSON.pages, subpackages = appJSON.subpackages, usingComponents = appJSON.usingComponents;
    var pageDepItems = genPageDepItems(pages);
    var componentItems = genPageDepItems(Object.values(usingComponents || {}));
    var subpackagePageDepItems = destructSubpackageFromAppJSON(subpackages);
    setDeps(pageDepItems);
    setDeps(componentItems);
    setDeps(subpackagePageDepItems);
    digPageJSONs(pageDepItems);
    digPageJSONs(componentItems);
    digPageJSONs(subpackagePageDepItems);
}
function digPageJSONs(depItems) {
    for (var _i = 0, depItems_1 = depItems; _i < depItems_1.length; _i++) {
        var dep = depItems_1[_i];
        digPageJSON(dep);
    }
}
function digPageJSON(depItem, data) {
    var pagePath = depItem.path;
    if (fs_extra_1["default"].pathExistsSync(pagePath)) {
        var pageConfig = fs_extra_1["default"].readJSONSync(pagePath);
        var usingComponents = pageConfig.usingComponents;
        var deps = genPageDepItems(Object.values(usingComponents || {}), { referred: depItem });
        setDeps(deps);
        digPageJSONs(deps);
    }
    else {
    }
}
function destructSubpackageFromAppJSON(subpackages) {
    if (!subpackages) {
        return [];
    }
    var pagePathArr = subpackages
        .map(function (subpackage) {
        var root = subpackage.root, pages = subpackage.pages;
        return pages.map(function (pagePath) { return path_1["default"].join(root, pagePath); });
    })
        .reduce(arrConcat);
    return pagePathArrToDepItems(pagePathArr);
}
function genPageDepItems(pagePath, data) {
    return [
        DepType.JS,
        DepType.JSON,
        DepType.WXSS,
        DepType.WXML,
    ].map(function (depType) { return ({
        type: depType,
        path: path_1["default"].join(SRC_DIR, appendFileSuffix(pagePath, depType)),
        data: data || {}
    }); });
}
function pagePathArrToDepItems(pagePathArr) {
    return pagePathArr.map(function (pagePath) { return genPageDepItems(pagePath); }).reduce(arrConcat);
}
function appendFileSuffix(groupPath, suffix) {
    return groupPath + "." + suffix;
}
function arrConcat(arr1, arr2) {
    return arr1.concat(arr2);
}
function _flatten(arr, result) {
    if (result === void 0) { result = []; }
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var a = arr_1[_i];
        if (Array.isArray(a)) {
            _flatten(a, result);
        }
        else {
            result.push(a);
        }
    }
}
function flatten(arr) {
    var result = [];
    _flatten(arr, result);
    return result;
}
var _a;
//# sourceMappingURL=resolveWxFiles.js.map