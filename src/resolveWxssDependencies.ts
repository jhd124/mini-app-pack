import {readFileSync, resolveUserModuleImportPath} from "./helper";
import * as css from "css";


function resolveWxssDependencies(filePath: string){
    const wxssCode = readFileSync(filePath);
    var ast = css.parse(wxssCode)
    return ast.stylesheet.rules
        .filter(rule => rule.type === "import")
        .map((rule) => resolveUserModuleImportPath(filePath, JSON.parse(rule.import)))
}
console.log(resolveWxssDependencies("./src/pages/index.wxss"))