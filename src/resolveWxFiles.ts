import * as fs from "fs-extra";
import * as path from "path";
import { resolveJsDeps } from "./resolveJsDeps";
import { isNpm } from "./helper";
import { resolveWxssDeps } from "./resolveWxssDeps";
import { resolveWxmlDeps } from "./resolveWxmlDeps";

const cwd = process.cwd();
const SRC_DIR = path.join(cwd, "src")

// 
const wxFileCollection = {
    [FileType.JS]: new Set<string>(),
    [FileType.WXML]: new Set<string>(),
    [FileType.WXSS]: new Set<string>(),
    [FileType.JSON]: new Set<string>(),
}

const npmCollection: Set<string> = new Set();
const wxssCollection: Set<string> = new Set();
const wxmlCollection: Set<string> = new Set();
const wxsCollection: Set<string> = new Set();
const jsonCollection: Set<string> = wxFileCollection[FileType.JSON];
const userJsModuleCollection: Map<string, JsFile> = new Map();


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

export function getDepCollection(){
    return {
        npmCollection,
        wxssCollection,
        wxmlCollection,
        wxsCollection,
        jsonCollection,
        userJsModuleCollection,
    };
}

export function resolveJsRecursive(filePath: string): void{
    if(!filePath){
        // noop
    } else {
        const {
            userModule,
            npmDepNames,
        } = resolveJsDeps(filePath)
        for(const npm of npmDepNames){
            npmCollection.add(npm);
        }
        const {
            path: jsPath,
            dependencies
        } = userModule;
        userJsModuleCollection.set(jsPath, userModule);
        for(const dep of dependencies){
            if(userJsModuleCollection.has(dep)){
                // noop
            } else {
                resolveJsRecursive(dep);
            }
        }
    }
}

export function resolveWxssRecursive(filePath: string): void{
    if(!filePath){
        // noop
    } else {
        const wxssFilePaths = resolveWxssDeps(filePath);
        for(const dep of wxssFilePaths){
            if(wxssCollection.has(dep)){
                // noop
            } else {
                wxssCollection.add(dep);
                resolveWxssRecursive(dep);
            }
        }
    }
}

export function resolveWxmlRecursive(filePath: string): void{
    if(!filePath){
        // noop
    } else {
        const {
            wxsDeps,
            wxmlDeps,
        } = resolveWxmlDeps(filePath);
        for(const dep of wxsDeps){
            wxsCollection.add(dep);
        }
        for(const dep of wxmlDeps){
            if(wxmlCollection.has(dep)){
                // noop
            } else {
                wxmlCollection.add(dep);
                resolveWxmlRecursive(dep);
            }
        }
    }
}


export function resolveFiles(){
    digAppJSON();
    const jsFilePaths = wxFileCollection[FileType.JS].keys();
    const wxmlFilePaths = wxFileCollection[FileType.WXML].keys();
    const wxssFilePaths = wxFileCollection[FileType.WXSS].keys();

    for(const jsFilePath of jsFilePaths){
        resolveJsRecursive(jsFilePath);
    }
    for(const wxmlFilePath of wxmlFilePaths){
        resolveWxmlRecursive(wxmlFilePath);
    }
    for(const wxssFilePath of wxssFilePaths){
        resolveWxssRecursive(wxssFilePath);
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

function setDep(dep: FileItem): void{
    const {type, path } = dep;
    const targetCollection = wxFileCollection[type];
    targetCollection.add(path)
}

function setDeps(deps: FileItem[]){
    for(const dep of deps){
        setDep(dep)
    }
}

function digPageJSONs(depItems: FileItem[]){
    for(const dep of depItems){
        digPageJSON(dep);
    }
}

function digPageJSON(fileItem: FileItem): void{
    const { path: pagePath }= fileItem
    if(fs.pathExistsSync(pagePath)){
        const pageConfig = fs.readJSONSync(pagePath);
        const { usingComponents } = pageConfig;
        const componentPaths: string[] = Object.values(usingComponents || {});
        const files = componentPaths.map(path => genPageDepItems(path));
        for(const file of files){
            setDeps(file);
            digPageJSONs(file)
        }
    } else {
        // noop
    }
}
/**
 * [{root: "a", pages: ["p1", "p2"]}, {root: "b", pages: ["p3", "p4"]}] -> DepItem[]
 * @param subpackages 
 */
function destructSubpackageFromAppJSON(subpackages: any[]): FileItem[]{
    if(!subpackages){
        return []
    }
    const pagePathArr = subpackages
        .map(subpackage => {
            const { root, pages }: { root: string, pages: string[] } = subpackage;
            return pages.map(pagePath => path.join(root, pagePath))
        })
        .reduce(arrConcat)
    return pagePathArrToDepItems(pagePathArr)
}

function genPageDepItems(pagePath: string): FileItem[]{
    return [
        {
            type: FileType.JS,
            path: appendFileExt(pagePath, FileType.JS)
        },
        {
            type: FileType.JSON,
            path: appendFileExt(pagePath, FileType.JSON)
        },
        {
            type: FileType.WXML,
            path: appendFileExt(pagePath, FileType.WXML)
        },
        {
            type: FileType.WXSS,
            path: appendFileExt(pagePath, FileType.WXSS)
        },

    ]
}

function pagePathArrToDepItems(pagePathArr: string[]): FileItem[]{
    return pagePathArr.map(pagePath => genPageDepItems(pagePath)).reduce(arrConcat);
}

function appendFileExt(groupPath: string, ext: string): string{
    return `${groupPath}.${ext}`
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

