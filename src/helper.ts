import * as fs from "fs-extra";
import {posix} from "path";
const {parse: pathParse, join: pathJoin, isAbsolute} = posix;

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