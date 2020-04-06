import { getDepCollection } from "./resolveWxFiles";
import generate from "@babel/generator";
import { getDistPathFromSrc, safeWrite, safeCopy, cwd, DIST_DIR } from "./helper";
import { pathExistsSync, existsSync, readJSONSync } from "fs-extra";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import nodeBuiltins from "rollup-plugin-node-builtins";
import { resolve as pathResolve } from "path"
import { FileType } from "./types";
import { rollup, InputOptions, OutputOptions } from "rollup";

export function writeUserJsFile(){
    const { userJsModuleCollection } = getDepCollection()
    for(const userModule of userJsModuleCollection){
        const [filePath, jsfileinfo] = userModule;
        const { ast } = jsfileinfo;
        const { code } = generate(ast);
        const distFilePath = getDistPathFromSrc(filePath);
        safeWrite(distFilePath, code);
    }
}

// export function rollupNpm(){
//     const { npmCollection } = getDepCollection();
    
// }

function copyFilesInCollection(collection: Set<string>): void{
    for(const file of collection){
        if(pathExistsSync(file)){
            const distFilePath = getDistPathFromSrc(file);
            safeCopy(file, distFilePath);
        } else {
            // todo
        }
    }
}

export function writeJsonFile(){
    const { jsonCollection } = getDepCollection();
    copyFilesInCollection(jsonCollection);
}

export function writeWxssFile(){
    const { wxssCollection } = getDepCollection();
    copyFilesInCollection(wxssCollection);
}

export function writeWxmlFile(){
    const {wxmlCollection} = getDepCollection();
    copyFilesInCollection(wxmlCollection);
}

export function writeWxsFile(){
    const {wxsCollection} = getDepCollection();
    copyFilesInCollection(wxsCollection);
}

export function rollupNodeModules(){
    
    const { npmCollection } = getDepCollection();

    for(const module of npmCollection){
        rollupNodeModule(module);
    }

}

function rollupNodeModule(moduleName: string): void {

    let modulePath = null;

    const moduleNameDir = `${cwd}/node_modules/${moduleName}`;
    const indexPath = moduleNameDir + "/index.js";
    const indexFileExist = existsSync(indexPath);


    if (indexFileExist) {
        modulePath = indexPath;
    } else {
        const { main } = readJSONSync(moduleNameDir + "/package.json");
        if (main) {
            modulePath = pathResolve(moduleNameDir, main);
        }
    }

    if (!modulePath) {
        throw new Error("can not find module " + moduleName);
    }

    const inputOptions: InputOptions = {
        input: modulePath,
        plugins: [
            resolve({ preferBuiltins: false }),
            commonjs(),
            // @ts-ignore
            nodeBuiltins(),
            rollupPluginFixNpmForMinApp()
        ],
        onwarn: function (warning: any) {
            // Skip certain warnings

            // should intercept ... but doesn't in some rollup versions
            if (warning.code === 'THIS_IS_UNDEFINED') { return; }

            // console.warn everything else
            console.warn(warning.message);
        }
    };

    const outputOptions: OutputOptions = {
        dir: `${DIST_DIR}/${moduleName}`,
        file: `${moduleName}${FileType.JS}`,
        format: "cjs"
    }

    rollup(inputOptions).then(bundle => bundle.write(outputOptions))
}

function rollupPluginFixNpmForMinApp() {
    return {
        name: "replace",
        transform(code: string, id: string) {
            if (/lodash/.test(id) || /_global/.test(id)) {
                const _code = code.replace(/Function\(['"]return this['"]\)\(\)/g,
                    `{
                    Array: Array,
                    Date: Date,
                    Error: Error,
                    Function: Function,
                    Math: Math,
                    Object: Object,
                    RegExp: RegExp,
                    String: String,
                    TypeError: TypeError,
                    setTimeout: setTimeout,
                    clearTimeout: clearTimeout,
                    setInterval: setInterval,
                    clearInterval: clearInterval
                  }`
                )
                return { code: _code }
            }
            if (/_html\.js/.test(id)) {
                return { code: "module.exports = false;" }
            }
            if (/_microtask/.test(id)) {
                let _code = code.replace(/if(Observer)/g, "if(false && Observer)")
                _code = code.replace(/Promise && Promise\.resolve/g, "false && Promise && Promise.resolve");
                return { code: _code };
            }
            if (/_freeGlobal/.test(id)) {
                const _code = code.replace(/module\.exports = freeGlobal;/g, "module.exports = freeGlobal || this;")
                return { code: _code };
            }
        }
    }
}

