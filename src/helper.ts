import * as fs from "fs-extra";
import {posix} from "path";
const {parse: pathParse, join: pathJoin, isAbsolute} = posix;

export const NPM_DIR = "/npm";

export function getDepAbsPath(filePath: string, moduleImportPath: string): string{
    const {dir} = pathParse(filePath);
    const isModuleImportPathAbsolute = isAbsolute(moduleImportPath);
    if(isModuleImportPathAbsolute){
        return moduleImportPath;
    } else {
        return pathJoin(dir, moduleImportPath);
    }
}

export function readFileSync(filePath: string): string{
    return fs.readFileSync(filePath, {encoding: "UTF8"})
}

export function isNpm(filePath: string): boolean{
    const regExp = /^\.|^\//;
    return !regExp.test(filePath);
}

export function getNpmModulePath(moduleName: string): string{
    return NPM_DIR + "/" + moduleName;
}

export function pendJsExt(filePath: string): string{
    const {ext} = pathParse(filePath);
    if(!ext){
        return `${filePath}.js`;
    } else {
        return filePath;
    }
}