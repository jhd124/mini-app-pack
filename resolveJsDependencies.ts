import * as fs from "fs-extra";
import {parse} from "@babel/parser"
import traverse, { NodePath } from "@babel/traverse";
import {parse as pathParse, join as pathJoin, isAbsolute} from "path";
import {resolveUserModuleImportPath} from "./helper"

const cwd = process.cwd();
const SRC_DIR = pathJoin(cwd, "src")

function getAst(path: string): any{
    const code: string = fs.readFileSync(path, "utf8");
    const ast: object = parse(code, {
        sourceType: "module"
    });
    return ast;
}

export function resolveJsDependencies(filePath: string){
    const ast = getAst(filePath);
    const { dir } = pathParse(filePath);
    const dependencyMap:any = {};
    traverse(ast, {
        CallExpression(path) {
        if(path.node.callee.name === "require"){
            const depPath = path.node.arguments[0].value;
            dependencyMap[depPath] = depPath;
        } 
      },
      ImportDeclaration(path){
        const depPath = path.node.source.value
        dependencyMap[depPath] = depPath;
      }
    });
    const depPaths: string[] = Object.values(dependencyMap);
    const npmDepPaths = depPaths.filter(depPath => recogniseNpm(depPath))
    const userModulePaths = depPaths
        .filter(depPath => !recogniseNpm(depPath))
        .map(depPath => resolveUserModuleImportPath(filePath, depPath))
    return {
        userModulePaths: userModulePaths,
        npmPaths: npmDepPaths
    }   
}

function recogniseNpm(filePath: string){
    const regExp = /^\.|^\//;
    return regExp.test(filePath);
}

