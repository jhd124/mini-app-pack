import * as cheerio from "cheerio";
import { getDepAbsPath, readFileSync } from "./helper";

export function resolveWxmlDependencies(filePath: string){
    const $ = cheerio.load(readFileSync(filePath))
    const wxsDependencies = getSrcsFromTag(filePath, $, "wxs")
    const wxmlDependencies = getSrcsFromTag(filePath, $, "template")
    return {
        wxsDependencies,
        wxmlDependencies,
    }
}

function getSrcsFromTag(filePath:string, cheer:CheerioStatic, tagName: string): string[]{
    return Array.from(cheer(tagName))
        .map(elem => elem.attribs.src)
        .filter(depPath => !!depPath)
        .map(depPath => getDepAbsPath(filePath, depPath))
}