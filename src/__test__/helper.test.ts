import { getDepAbsPath } from "../helper";

test("getDepAbsPaht should return absoulte path of a dependency", () => {
    expect(getDepAbsPath("/pages/index/Index.js", "../../utils/handler.js"))
        .toEqual("/utils/handler.js")
    
    expect(getDepAbsPath("/pages/index/Index.js", "/utils/handler.js"))
        .toEqual("/utils/handler.js")
})
