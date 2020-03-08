import * as fs from "fs-extra";
import * as path from "path";
import {
    readConfig
} from "./helper";

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

type DepPath = string

enum DepType {
    JS = "js",
    WXML = "wxml",
    WXSS = "wxss",
    JSON = "json",
    WXS = "wxs",
}

type DepCollection = {
    [DepType.JS]: Map<DepPath, any>,
    [DepType.WXML]: Map<DepPath, any>,
    [DepType.WXSS]: Map<DepPath, any>,
    [DepType.JSON]: Map<DepPath, any>,
    [DepType.WXS]: Map<DepPath, any>,
}

const depCollection: DepCollection = {
    [DepType.JS]: new Map(),
    [DepType.WXML]: new Map(),
    [DepType.WXSS]: new Map(),
    [DepType.JSON]: new Map(),
    [DepType.WXS]: new Map(),
}

type DepItem = {
    type: DepType,
    path: DepPath,
    data: any,
}

function setDep(dep: DepItem): void{
    const {type, path, data } = dep;
    const targetCollection = depCollection[type];
    if(targetCollection.has(path)){
        const currentData = targetCollection.get(path);
        targetCollection.set(path, [...currentData, data]);
    } else {
        targetCollection.set(path, [data])
    }
}

function setDeps(deps: DepItem[]){
    for(const dep of deps){
        setDep(dep)
    }
}

function getDepsByType(type: DepType): Map<DepPath, any>{
    return depCollection[type];
}

function getDepCollection(): DepCollection{
    return depCollection;
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

function digPageJSONs(depItems: DepItem[]){
    for(const dep of depItems){
        digPageJSON(dep);
    }
}

function digPageJSON(depItem: DepItem, data?: any): void{
    const { path: pagePath }= depItem
    if(fs.pathExistsSync(pagePath)){
        const pageConfig = fs.readJSONSync(pagePath);
        const { usingComponents } = pageConfig;
        const componentPaths = Object.values(usingComponents || {});
        const deps = genPageDepItems(
            Object.values(usingComponents || {}), 
            { referred: depItem }
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

function genPageDepItems(pagePath: string, data?: any): DepItem[]{
    return [
        DepType.JS,
        DepType.JSON,
        DepType.WXSS,
        DepType.WXML,
    ].map(depType => ({
        type: depType,
        path: appendFileSuffix(pagePath, depType),
        data: data || {}
    }))
}

function pagePathArrToDepItems(pagePathArr: string[]): DepItem[]{
    return pagePathArr.map(pagePath => genPageDepItems(pagePath)).reduce(arrConcat);
}

function appendFileSuffix(groupPath: string, suffix: string): DepPath{
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
