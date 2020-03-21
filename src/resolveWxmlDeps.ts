import * as cheerio from "cheerio";
import { getDepAbsPath, readFileSync } from "./helper";

export function resolveWxmlDeps(filePath: string): {
    wxsDeps: string[],
    wxmlDeps: string[],
}{
    const $ = cheerio.load(readFileSync(filePath))
    const wxsDeps = getSrcsFromTag(filePath, $, "wxs")
    const wxmlDeps = getSrcsFromTag(filePath, $, "template")
    return {
        wxsDeps,
        wxmlDeps,
    }
}

function getSrcsFromTag(filePath:string, cheer:CheerioStatic, tagName: string): string[]{
    return Array.from(cheer(tagName))
        .map(elem => elem.attribs.src)
        .filter(depPath => !!depPath)
        .map(depPath => getDepAbsPath(filePath, depPath))
}