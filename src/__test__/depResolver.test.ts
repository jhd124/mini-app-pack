import { resolveWxmlDependencies } from "../resolveWxmlDependencies"
import { resolveWxssDependencies } from "../resolveWxssDependencies"
import { readFileSync } from "fs-extra";
import { resolveJsDeps, npmDir } from "../resolveJsDeps";
import generate from "@babel/generator";

jest.mock("fs-extra");

describe("resolveWxmlDependencies", () => {
    test("should return the paths of dependencies in certain wxml file", () => {
        const filePath = "/pages/index/Index.wxml";

        readFileSync.mockImplementationOnce((path: string) => {
            if(path === filePath){
                return `
                    <view class="some-class"></view>
                    <template
                        src="../templates/header.wxml"
                        data="{{ data1: 'data1', data2: data2}}"
                    ></template>
                    <wxs src="../../wxs/computeSum.wxs" module="computeSum"></wxs>
                `
            }
        })

        expect(resolveWxmlDependencies(filePath)).toEqual({
            wxsDependencies: ["/wxs/computeSum.wxs"],
            wxmlDependencies: ["/pages/templates/header.wxml"]
        })
    })
})

describe("resolveWxssDependencies", () => {
    test("should return the paths of dependencies in certain wxss file", () => {
        const filePath = "/pages/index/Index.wxss"

        readFileSync.mockImplementationOnce((path:string) => {
            if(path === filePath){
                return `
                    @import "../../style/common.wxss";
                    @import "../header.wxss";
        
                    .class-a, class-b{
                        position: absolute;
                        display: flex;
                        justify-content: center;
                    }
                `;
            }
        })
        
        expect(resolveWxssDependencies(filePath)).toEqual([
            "/style/common.wxss",
            "/pages/header.wxss",
        ])
    })

})

describe("resolveJsDependencies", () => {
    test.only("should return the paths of dependencies in certain js file", () => {
        const filePath = "/pages/index/Index.js";
        readFileSync.mockImplementationOnce((path: string) => {
            if(path === filePath){
                return `
                    require("somePf");
                    import "somethingMagical";
                    const _ = require("lodash");
                    import moment from "moment";
                    const login = require("../../utils/login.js");
                    import message from "../../message/message.js";
                    import { messageType } from "../../message/message.js";
                    const {loginByCode} = require("../../utils/wxLogin");
                    import {conversation as c} from "../../message/messageUtils.js";
                    import * as wxContext from "../../utils/wxContext.js";
                `;
            }
        })

        const result = resolveJsDeps(filePath);
        const {
            npmDepNames,
            userModule
        } = result;
        expect(npmDepNames).toEqual([
            "somePf",
            "somethingMagical",
            "lodash",
            "moment",
        ])
        expect(userModule.dependencies).toEqual([
            "/utils/login.js",
            "/message/message.js",
            "/utils/wxLogin.js",
            "/message/messageUtils.js",
            "/utils/wxContext.js",
        ])
        expect(userModule.path).toEqual(filePath);
        
        const {code} = generate(userModule.ast)
        
        expect(code).toMatch(`${npmDir}/somePf`)
        expect(code).toMatch(`${npmDir}/somethingMagical`)
        expect(code).toMatch(`${npmDir}/lodash`)
        expect(code).toMatch(`${npmDir}/moment`)

    })
})