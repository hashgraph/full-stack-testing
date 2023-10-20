import {Init} from "./init.mjs";
import {test, expect} from "@jest/globals";


test('init: install kind should pass', () => {
    expect(Init.installKind).not.toThrowError()
});