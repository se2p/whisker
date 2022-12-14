import {expect} from "@jest/globals";
import {InputEffect, InputEffectName} from "../../../../src/whisker/model/components/InputEffect";

describe('InputEffect', () => {
    test("constructor, getters", () => {
        expect(() => {
            new InputEffect("id", InputEffectName.InputKey, ["left"]);
        }).not.toThrow();
        expect(() => {
            new InputEffect(undefined, InputEffectName.InputKey, ["left"]);
        }).toThrow();
    });

    test("not enough arguments", () => {
        expect(() => {
            new InputEffect("test", InputEffectName.InputKey, []);
        }).toThrow();
        expect(() => {
            new InputEffect("test", InputEffectName.InputClickSprite, []);
        }).toThrow();
        expect(() => {
            new InputEffect("test", InputEffectName.InputText, []);
        }).toThrow();
        expect(() => {
            new InputEffect("test", InputEffectName.InputMouseDown, []);
        }).toThrow();
        expect(() => {
            new InputEffect("test", InputEffectName.InputClickStage, []);
        }).not.toThrow();
        expect(() => {
            new InputEffect("test", InputEffectName.InputMouseMove, []);
        }).toThrow();
        expect(() => {
            new InputEffect("test", InputEffectName.InputMouseMove, [0]);
        }).toThrow();

        expect(() => {
            new InputEffect("test", InputEffectName.InputKey, ["left"]).simplifyForSave();
        }).not.toThrow();
    });
});
