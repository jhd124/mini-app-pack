import {readFileSync, getDepAbsPath} from "./helper";
import * as css from "css";


export function resolveWxssDeps(filePath: string): WxssFileInfo{
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

export function walkWxssFiles(
    entries: string[],
    visitor: (arg: WxssFileInfo) => {}
): void{
    
    const footprint: Set<string> = new Set();

    function walkFiles(entries: string[]){
        for(const filePath of entries){
            if(footprint.has(filePath)){
                // noop
            } else {
                footprint.add(filePath);

                const wxssFileInfo = resolveWxssDeps(filePath);

                if(visitor){
                    visitor(wxssFileInfo);
                }

                walkFiles(wxssFileInfo.wxssDeps);

            }
        }
    }

    walkFiles(entries);

}
