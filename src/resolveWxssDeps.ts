import {readFileSync, getDepAbsPath} from "./helper";
import * as css from "css";
import { WxssFileInfo } from './types';
import { pathExistsSync } from "fs-extra";

export function resolveWxssDeps(filePath: string): WxssFileInfo{
    if(!pathExistsSync(filePath)){
        // TODO warn
        return null;
    } else {
        const wxssCode = readFileSync(filePath);
        var ast = css.parse(wxssCode)
        const deps = ast.stylesheet.rules
            .filter(rule => rule.type === "import")
            .map((rule: css.Import) => getDepAbsPath(filePath, JSON.parse(rule.import)))
        return {
            wxssDeps: deps,
            ast,
            filePath,
        }
    }
}

export function walkWxssFiles(
    entries: string[],
    visitor: (arg: WxssFileInfo) => void
): void{
    
    const footprint: Set<string> = new Set();

    function walkFiles(entries: string[]){
        for(const filePath of entries){
            if(footprint.has(filePath)){
                // noop
            } else {
                footprint.add(filePath);

                const wxssFileInfo = resolveWxssDeps(filePath);

                if(wxssFileInfo){
                    if(visitor){
                        visitor(wxssFileInfo);
                    }
    
                    walkFiles(wxssFileInfo.wxssDeps);
                }

            }
        }
    }

    walkFiles(entries);

}
