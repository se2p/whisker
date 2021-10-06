import {expect} from "@jest/globals";
import {InputEffect, InputEffectName} from "../../../../src/whisker/model/components/InputEffect";

describe('InputEffect', () => {
    test("constructor, getters", () => {
        expect(() => {
            new InputEffect("id", InputEffectName.InputKey, ["left"])
        }).not.toThrow();
        expect(() => {
            new InputEffect(undefined, InputEffectName.InputKey, ["left"])
        }).not.toThrow();
    })

    test("not enough arguments", () => {
        expect(() => {
            new InputEffect(undefined, InputEffectName.InputKey, [])
        }).toThrow();
        expect(() => {
            new InputEffect(undefined, InputEffectName.InputClickSprite, [])
        }).toThrow();
        expect(() => {
            new InputEffect(undefined, InputEffectName.InputText, [])
        }).toThrow();
        expect(() => {
            new InputEffect(undefined, InputEffectName.InputMouseDown, [])
        }).toThrow();
        expect(() => {
            new InputEffect(undefined, InputEffectName.InputClickStage, [])
        }).not.toThrow();
        expect(() => {
            new InputEffect(undefined, InputEffectName.InputMouseMove, [])
        }).toThrow();
        expect(() => {
            new InputEffect(undefined, InputEffectName.InputMouseMove, [0])
        }).toThrow();

        expect(() => {
            new InputEffect(undefined, InputEffectName.InputKey, ["left"]).simplifyForSave();
        }).not.toThrow();
    })
})
