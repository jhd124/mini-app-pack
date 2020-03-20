import * as fs from "fs-extra";
import * as path from "path";
import { resolveJsDeps } from "./resolveJsDeps";

const cwd = process.cwd();
const SRC_DIR = path.join(cwd, "src")

function readAppJSON(){
    const appJSONPath = `${SRC_DIR}/app.json`;
    if(fs.pathExistsSync(appJSONPath)){
        return fs.readJSONSync(`${appJSONPath}`)
    } else {
        throw new Error(`
            app.json is not found in ${appJSONPath}
            请确认文件${appJSONPath}存在
        `)
    }
}

enum DepType {
    JS = "js",
    WXML = "wxml",
    WXSS = "wxss",
    JSON = "json",
    WXS = "wxs",
    NPM = "npm",
}

type DepCollection = {
    [DepType.JS]: Map<string, any>,
    [DepType.WXML]: Map<string, any>,
    [DepType.WXSS]: Map<string, any>,
    [DepType.JSON]: Map<string, any>,
    [DepType.WXS]: Map<string, any>,
    [DepType.NPM]: Map<string, any>,
}

const depCollection: DepCollection = {

    [DepType.JS]: new Map(),
    [DepType.WXML]: new Map(),
    [DepType.WXSS]: new Map(),
    [DepType.JSON]: new Map(),
    [DepType.WXS]: new Map(),
    [DepType.NPM]: new Map(),
}

type DepItem = {
    type: DepType,
    path: string,
}

export function getDepsByType(type: DepType): Map<string, any>{
    return depCollection[type];
}

export function getDepCollection(): DepCollection{
    return depCollection;
}

function isInCollection(depItem: DepItem): boolean{
    const subCollection = depCollection[depItem.type];
    if(subCollection.has(depItem.path)){
        return true;
    }
    return false;
}

function resolveJsRecursive(path: string): void{
    const depItem = {path, type: DepType.JS};
    if(!path){
        // noop
    } else if(isInCollection(depItem)){
        // noop
    } else {
        const deps = resolveJsDeps(path);
        const {
            userModulePaths,
            npmPaths,
        } = deps;
        const npmDepItems = npmPaths.map(path => ({ type: DepType.NPM, path }))
        const jsDepItems = userModulePaths.map(path => ({type: DepType.JS, path}));
        setDeps(npmDepItems);
        setDeps(jsDepItems);

        for(const filePath of userModulePaths){
            resolveJsRecursive(filePath);
        }

    }
}

function resolveDependencies(){
    digAppJSON();
    const jsPaths = depCollection[DepType.JS].keys()
    for(const jsPath of jsPaths){
        resolveJsRecursive(jsPath);
    }
}

function digAppJSON(): void{
    const appJSON = readAppJSON();
    const {
        pages,
        subpackages,
        usingComponents,
    } = appJSON;
    const componentPaths: string[] = Object.values(usingComponents || {});

    const pageDepItems = pagePathArrToDepItems(pages);
    const componentItems = pagePathArrToDepItems(componentPaths);
    const subpackagePageDepItems = destructSubpackageFromAppJSON(subpackages);

    setDeps(pageDepItems);
    setDeps(componentItems);
    setDeps(subpackagePageDepItems);

    digPageJSONs(pageDepItems);
    digPageJSONs(componentItems);
    digPageJSONs(subpackagePageDepItems);
}

function setDep(dep: DepItem): void{
    const {type, path } = dep;
    const targetCollection = depCollection[type];
    targetCollection.set(path, {path})
}

function setDeps(deps: DepItem[]){
    for(const dep of deps){
        setDep(dep)
    }
}

function digPageJSONs(depItems: DepItem[]){
    for(const dep of depItems){
        digPageJSON(dep);
    }
}

function digPageJSON(depItem: DepItem): void{
    const { path: pagePath }= depItem
    if(fs.pathExistsSync(pagePath)){
        const pageConfig = fs.readJSONSync(pagePath);
        const { usingComponents } = pageConfig;
        const componentPaths = Object.values(usingComponents || {});
        const deps = genPageDepItems(
            Object.values(usingComponents || {})
        );
        setDeps(deps);
        digPageJSONs(deps)
    } else {
        // noop
    }
}
/**
 * [{root: "a", pages: ["p1", "p2"]}, {root: "b", pages: ["p3", "p4"]}] -> DepItem[]
 * @param subpackages 
 */
function destructSubpackageFromAppJSON(subpackages: any[]): DepItem[]{
    if(!subpackages){
        return []
    }
    const pagePathArr = subpackages
        .map(subpackage => {
            const {
                root,
                pages,
            } = subpackage;
            return pages.map(pagePath => path.join(root, pagePath))
        })
        .reduce(arrConcat)
    return pagePathArrToDepItems(pagePathArr)
}

function genPageDepItems(pagePath: string): DepItem[]{
    return [
        DepType.JS,
        DepType.JSON,
        DepType.WXSS,
        DepType.WXML,
    ].map(depType => ({
        type: depType,
        path: appendFileSuffix(pagePath, depType),
    }))
}

function pagePathArrToDepItems(pagePathArr: string[]): DepItem[]{
    return pagePathArr.map(pagePath => genPageDepItems(pagePath)).reduce(arrConcat);
}

function appendFileSuffix(groupPath: string, suffix: string): string{
    return `${groupPath}.${suffix}`
}

function arrConcat(arr1: any[], arr2: any[]){
    return [...arr1, ...arr2]
}

function _flatten(arr: any[], result: any[] = []){
    for(const a of arr){
        if(Array.isArray(a)){
            _flatten(a, result);
        } else {
            result.push(a)
        }
    }
}
function flatten(arr: any[]){
    const result: any[] = [];
    _flatten(arr, result);
    return result;
}

