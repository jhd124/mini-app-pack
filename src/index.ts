#!/usr/bin/env node
import meow from "meow";
import { init } from "./context";

const cli = meow(
    `
    usage: mpack sourceDir
    `,
    )
    
    const projectPath = cli.input[0]
    console.log('projectPath :', projectPath);
    if(!projectPath){
        throw new Error(`
        Argument projectPath is required
    Usage: mpack your-project-directory
    `)
}

init({
    projectPath    
})

import { rollupNodeModules, writeUserJsFile, writeJsonFile, writeWxssFile, writeWxmlFile, writeWxsFile } from "./writeToDist";
import { walkAllFiles } from "./resolveWxFiles";


walkAllFiles();
rollupNodeModules();
writeUserJsFile();
writeJsonFile();
writeWxssFile();
writeWxmlFile();
writeWxsFile();