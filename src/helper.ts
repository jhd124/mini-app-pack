import * as fs from "fs-extra";
import {parse as pathParse, join as pathJoin, isAbsolute, resolve } from "path";
import { getOptions } from "./context";

const { projectPath } = getOptions();
export const SRC_DIR = resolve(projectPath, "src")
export const DIST_DIR = resolve(projectPath, "dist")
export const NPM_DIST_DIR = resolve(DIST_DIR, "/npm");

export function getDepAbsPath(filePath: string, moduleImportPath: string): string{
    
    const {dir} = pathParse(filePath);
    const isModuleImportPathAbsolute = isAbsolute(moduleImportPath);
    if(isModuleImportPathAbsolute){
        return moduleImportPath;
    } else {
        return pathJoin(dir, moduleImportPath);
    }
}

export function getDistPathFromSrc(filePath: string): string{
    return filePath.replace(SRC_DIR, DIST_DIR);
}

export function readFileSync(filePath: string): string{
    return fs.readFileSync(filePath, {encoding: "UTF8"})
}

export function isNpm(filePath: string): boolean{
    const regExp = /^\.|^\//;
    return !regExp.test(filePath);
}

export function getNpmModulePath(moduleName: string): string{
    return NPM_DIST_DIR + "/" + moduleName;
}

export function pendJsExt(filePath: string): string{
    const {ext} = pathParse(filePath);
    if(!ext){
        return `${filePath}.js`;
    } else {
        return filePath;
    }
}

export function safeWrite(filePath: string, content: string): void{
    fs.ensureFileSync(filePath);
    fs.writeFileSync(filePath, content);
}

export function safeCopy(source: string, dest: string): void{
    fs.ensureFileSync(source);
    fs.copyFileSync(source, dest);
}
