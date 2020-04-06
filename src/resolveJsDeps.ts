import * as fs from "fs-extra";
import {parse} from "@babel/parser"
import traverse, { NodePath } from "@babel/traverse";
import {parse as pathParse, join as pathJoin, isAbsolute} from "path";
import {
    getDepAbsPath,
    isNpm,
    getNpmModulePath,
    pendJsExt,
} from "./helper"
import * as t from "@babel/types"
import { JsFileInfo } from './types';

const cwd = process.cwd();
const SRC_DIR = pathJoin(cwd, "src")

export function resolveJsDeps(filePath: string): JsFileInfo{
    const ast = getAst(filePath);
    const { dir } = pathParse(filePath);
    const npmDepNames: Set<string> = new Set();//string[] = [];
    const userModuleDeps: Set<string> = new Set();
  
    traverse(ast, {
        CallExpression(path) {
        if(path.node.callee.name === "require"){
            
            const depPath = path.node.arguments[0].value;
            
            if(isNpm(depPath)){

                npmDepNames.add(depPath);

                path.node.arguments[0] = t.stringLiteral(getNpmModulePath(depPath))

            } else {

                const userModulePath = pendJsExt(getDepAbsPath(filePath, depPath))

                userModuleDeps.add(userModulePath);

            }
        } 
      },
      ImportDeclaration(path){

        const depPath = path.node.source.value;

        if(isNpm(depPath)){

            npmDepNames.add(depPath);

            path.node.source = t.stringLiteral(getNpmModulePath(depPath))
        } else {

            const userModulePath = pendJsExt(getDepAbsPath(filePath, depPath))

            userModuleDeps.add(userModulePath);
        }
      }
    });
    return {
        filePath,
        userModuleDeps: Array.from(userModuleDeps),
        ast,
        npmDeps: Array.from(npmDepNames),
    }   
}

export function walkJsFiles(entries: string[], visitor: (arg: JsFileInfo) => void){

    const footprint: Set<string> = new Set();

    function walkFiles(entries: string[]){
        
        for(const filePath of entries){
            if(footprint.has(filePath)){
                // noop
            } else {
                footprint.add(filePath);

                const jsFileInfo = resolveJsDeps(filePath)
                if(visitor){
                    visitor(jsFileInfo);
                }
                   
                walkFiles(jsFileInfo.userModuleDeps);
            }
        }
    }
    walkFiles(entries);
}

function getAst(path: string): any{
    const code: string = fs.readFileSync(path, "utf8");
    const ast: object = parse(code, {
        sourceType: "module"
    });
    return ast;
}
