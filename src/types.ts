enum FileType {
    JS = "js",
    WXML = "wxml",
    WXSS = "wxss",
    JSON = "json",
    WXS = "wxs",
    NPM = "npm",
}

type FileItem = {
    type: FileType,
    path: string,
}

type JsFile = {
    path: string,
    dependencies: string[],
    ast: any,
}