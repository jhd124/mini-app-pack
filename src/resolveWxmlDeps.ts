import * as cheerio from "cheerio";
import { getDepAbsPath, readFileSync } from "./helper";

export function resolveWxmlDeps(filePath: string): WxmlFileInfo{
    const $ = cheerio.load(readFileSync(filePath))
    const wxsDeps = getSrcsFromTag(filePath, $, "wxs")
    const wxmlDeps = getSrcsFromTag(filePath, $, "template")
    return {
        wxsDeps,
        wxmlDeps,
        ast: $,
        filePath: filePath,
    }
}

function getSrcsFromTag(filePath:string, cheer:CheerioStatic, tagName: string): string[]{
    return Array.from(cheer(tagName))
        .map(elem => elem.attribs.src)
        .filter(depPath => !!depPath)
        .map(depPath => getDepAbsPath(filePath, depPath))
}

function walkWxmlFiles(
    entries: string[],
    visitor: (arg: WxmlFileInfo) => {}
) {

    const footprint: Set<string> = new Set();

    function walkFiles(entries: string[]){
        for(const filePath of entries){
            if(footprint.has(filePath)){
                // noop
            } else {
                footprint.add(filePath);

                const wxmlFileInfo = resolveWxmlDeps(filePath);

                if(visitor){
                    visitor(wxmlFileInfo);
                }
                
                walkFiles(wxmlFileInfo.wxmlDeps);
            }
        }
    }
    
    walkFiles(entries)

}
