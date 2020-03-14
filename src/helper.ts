import * as fs from "fs-extra";
import {parse as pathParse, join as pathJoin, isAbsolute} from "path";

export function resolveUserModuleImportPath(filePath: string, moduleImportPath: string): string{
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