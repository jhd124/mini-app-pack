export enum FileType {
    JS = "js",
    WXML = "wxml",
    WXSS = "wxss",
    JSON = "json",
    WXS = "wxs",
    NPM = "npm",
}

export type FileItem = {
    type: FileType.JS | FileType.WXML | FileType.WXSS | FileType.JSON,
    path: string,
}

export type JsFile = {
    path: string,
    dependencies: string[],
    ast: any,
}

export type JsFileInfo = {
    npmDeps: string[],
    userModuleDeps: string[],
    ast: any,
    filePath: string
}

export type WxmlFileInfo = {
    wxsDeps: string[],
    wxmlDeps: string[],
    ast: any,
    filePath: string,
}

export type WxssFileInfo = {
    wxssDeps: string[],
    ast: any,
    filePath: string,
}
