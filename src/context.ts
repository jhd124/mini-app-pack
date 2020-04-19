import { initOptions } from "./types";

let options: initOptions;

export function init(_options: initOptions){
    options = _options;
}

export function getOptions(){
    if(!options){
        throw new Error("Should call method init first");
    }
    return options;
}