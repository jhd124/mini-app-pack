import * as fs from "fs-extra";
import {parse} from "@babel/parser"
import traverse, { NodePath } from "@babel/traverse";
import {parse as pathParse, join as pathJoin, isAbsolute} from "path";
import {getDepAbsPath} from "./helper"
import * as t from "@babel/types"

const cwd = process.cwd();
const SRC_DIR = pathJoin(cwd, "src")

export const npmDir = "/npm"

export function resolveJsDeps(filePath: string){
    const ast = getAst(filePath);
    const { dir } = pathParse(filePath);
    const npmDepNames: Set<string> = new Set()//string[] = [];
    const userModuleDeps: Set<string> = new Set();
  
    traverse(ast, {
        CallExpression(path) {
        if(path.node.callee.name === "require"){
            
            const depPath = path.node.arguments[0].value;
            console.log(depPath)
            if(isNpm(depPath)){

                npmDepNames.add(depPath);

                path.node.arguments[0] = t.stringLiteral(getNpmModulePath(depPath))

            } else {

                const userModulePath = pendExt(getDepAbsPath(filePath, depPath))

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

            const userModulePath = pendExt(getDepAbsPath(filePath, depPath))

            userModuleDeps.add(userModulePath);
        }
      }
    });
    return {
        userModule: {
            path: filePath,
            dependencies: Array.from(userModuleDeps),
            ast,
        },
        npmDepNames: Array.from(npmDepNames),
    }   
}

function getAst(path: string): any{
    const code: string = fs.readFileSync(path, "utf8");
    const ast: object = parse(code, {
        sourceType: "module"
    });
    return ast;
}

function isNpm(filePath: string): boolean{
    const regExp = /^\.|^\//;
    return !regExp.test(filePath);
}

function getNpmModulePath(moduleName: string): string{
    return npmDir + "/" + moduleName;
}

function pendExt(filePath: string): string{
    const {ext} = pathParse(filePath);
    if(!ext){
        return `${filePath}.js`;
    } else {
        return filePath;
    }
}
