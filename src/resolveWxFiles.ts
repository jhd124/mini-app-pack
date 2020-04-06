import * as fs from "fs-extra";
import * as path from "path";
import { walkJsFiles } from "./resolveJsDeps";
import { walkWxssFiles } from "./resolveWxssDeps";
import { walkWxmlFiles } from "./resolveWxmlDeps";
import {FileType, FileItem, JsFileInfo} from './types';
import { SRC_DIR } from "./helper";
 
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
const userJsModuleCollection: Map<string, JsFileInfo> = new Map();


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


// const {
//     userModule,
//     npmDepNames,
// } = resolveJsDeps(filePath)
// for(const npm of npmDepNames){
//     npmCollection.add(npm);
// }
// const {
//     path: jsPath,
//     dependencies
// } = userModule;
// userJsModuleCollection.set(jsPath, userModule);
// for(const dep of dependencies){
//     if(userJsModuleCollection.has(dep)){
//         // noop
//     } else {
//         resolveJsRecursive(dep);
//     }
// }

export function walkAllFiles(){
    digAppJSON();
    const jsFilePaths = Array.from(wxFileCollection[FileType.JS].keys());
    const wxmlFilePaths = Array.from(wxFileCollection[FileType.WXML].keys());
    const wxssFilePaths = Array.from(wxFileCollection[FileType.WXSS].keys());

    walkJsFiles(jsFilePaths, function(jsFileInfo){
        const {
            npmDeps,
            filePath,
        } = jsFileInfo;

        for(const npm of npmDeps){
            npmCollection.add(npm);
        }

        // for(const userModule of userModuleDeps){
            userJsModuleCollection.set(filePath, jsFileInfo);
        // }

    });

    walkWxssFiles(wxssFilePaths, function(wxssFileInfo){
        const {
            wxssDeps,
        } = wxssFileInfo;

        for(const wxssDep of wxssDeps){
            wxssCollection.add(wxssDep);
        }

    });
    
    walkWxmlFiles(wxmlFilePaths, function(wxmlFileInfo){
        const {
            wxmlDeps,
            wxsDeps,
        } = wxmlFileInfo;
        for(const wxsDep of wxsDeps){
            wxsCollection.add(wxsDep);
        }
        for(const wxmlDep of wxmlDeps){
            wxmlCollection.add(wxmlDep);
        }
    });

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
    const {type, path: filePath } = dep;
    const targetCollection = wxFileCollection[type];
    const depPath = path.join(SRC_DIR, filePath);
    targetCollection.add(depPath)
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
    return pagePathArr.map(pagePath => genPageDepItems(pagePath)).reduce(arrConcat, []);
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

