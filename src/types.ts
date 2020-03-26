enum FileType {
    JS = "js",
    WXML = "wxml",
    WXSS = "wxss",
    JSON = "json",
    WXS = "wxs",
    NPM = "npm",
}

type FileItem = {
    type: FileType.JS | FileType.WXML | FileType.WXSS | FileType.JSON,
    path: string,
}

type JsFile = {
    path: string,
    dependencies: string[],
    ast: any,
}

type JsFileInfo = {
    npmDeps: string[],
    userModuleDeps: string[],
    ast: any,
    filePath: string
}

type WxmlFileInfo = {
    wxsDeps: string[],
    wxmlDeps: string[],
    ast: any,
    filePath: string,
}

type WxssFileInfo = {
    wxssDeps: string[],
    ast: any,
    filePath: string,
}
