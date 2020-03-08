import * as cheerio from "cheerio";
import { resolveUserModuleImportPath, readFileSync } from "./helper";

function resolveWxmlDependencies(filePath: string){
    const $ = cheerio.load(readFileSync(filePath))
    console.log($("wxs").attr("src"))
    const wxsDependencies = getSrcsFromTag(filePath, $, "wxs")
    const wxmlDependencies = getSrcsFromTag(filePath, $, "wxml")
    return {
        wxsDependencies,
        wxmlDependencies,
    }
}

function getSrcsFromTag(filePath:string, cheer:CheerioStatic, tagName: string): string[]{
    Array.from(cheer(tagName))
        .map(elem => elem.attribs.src)
        .filter(depPath => !!depPath)
        .map(depPath => resolveUserModuleImportPath(filePath, depPath))
}