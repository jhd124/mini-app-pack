import {readFileSync, getDepAbsPath} from "./helper";
import * as css from "css";


export function resolveWxssDependencies(filePath: string): string[]{
    const wxssCode = readFileSync(filePath);
    var ast = css.parse(wxssCode)
    return ast.stylesheet.rules
        .filter(rule => rule.type === "import")
        .map((rule) => getDepAbsPath(filePath, JSON.parse(rule.import)))
}
