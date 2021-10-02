// for building model-editor checks, should equal CheckName.ts in model and InputEffectName in InputEffect.ts

const argType = {
    spriteNameRegex: "spriteName",
    attrName: "attrName",
    change: "change",
    comp: "comp",
    costumeName: "costumeName",
    value: "value",
    functionC: "function",
    keyName: "keyName",
    r: "r",
    g: "g",
    b: "b",
    varNameRegex: "varNameRegex",
    expr: "expr",
    probValue: "probValue",
    time: "time",
    bool: "bool",
    coordX: "coordX",
    coordY: "coordY"
}

const inputLabelCodes = {
    // sprite name
    InputClickSprite: [argType.spriteNameRegex],
    // nothing
    InputClickStage: [],
    // key name (input for one step)
    InputKey: [argType.keyName],
    // true | false
    InputMouseDown: [argType.bool],
    // x, y
    InputMouseMove: [argType.coordX, argType.coordY],
    // answer| text
    InputText: [argType.value]
}

const checkLabelCodes = {
    //3 args:  sprite name, attr name, ( + | - | = | += | -= | +<number> | <number> | -<number>)
    AttrChange: [argType.spriteNameRegex, argType.attrName, argType.change],
    // 4 args: sprite name, attribute name, comparison (=,>,<...), value to compare to
    AttrComp: [argType.spriteNameRegex, argType.attrName, argType.comp, argType.value],
    // 1 arg: new background name
    BackgroundChange: [argType.costumeName],
    // 1 args: sprite name
    Click: [argType.spriteNameRegex],
    //1 args code
    Function: [argType.functionC],
    // 1 args: key name
    Key: [argType.keyName],
    // 2 sprite name, string output
    Output: [argType.spriteNameRegex, argType.expr],
    // 4  args: sprite name, red, green, blue values
    SpriteColor: [argType.spriteNameRegex, argType.r, argType.g, argType.b],
    // 2  args: two sprite names
    SpriteTouching: [argType.spriteNameRegex, argType.spriteNameRegex],
    // 3 sprite name, var name, ( + | - | = | += | -= |+<number> | <number> |-<number>)
    VarChange: [argType.spriteNameRegex, argType.varNameRegex, argType.change],
    // 4 args: sprite name, variable name, comparison (=,>,<...), value to compare to
    VarComp: [argType.spriteNameRegex, argType.varNameRegex, argType.comp, argType.value],
    // 1  evaluate an expression, args: expression
    Expr: [argType.expr],
    // 1 for randomness, percentage
    Probability: [argType.probValue],
    // 1 // time from the test start on, time in milliseconds
    TimeElapsed: [argType.time],
    //1 //  time from the last edge transition in the model, in milliseconds
    TimeBetween: [argType.time],
    // 1 // time from program end (for after end models)
    TimeAfterEnd: [argType.time],
    // 3 // sprite name, comparison, number
    NbrOfClones: [argType.spriteNameRegex, argType.comp, argType.value],
    // 3 // sprite name, comparison, number
    NbrOfVisibleClones: [argType.spriteNameRegex, argType.comp, argType.value],
    //1 // sprite name regex
    TouchingEdge: [argType.spriteNameRegex],
    // 1 // sprite name regex
    TouchingVerticalEdge: [argType.spriteNameRegex],
    // 1 // sprite name regex
    TouchingHorizEdge: [argType.spriteNameRegex],
    // 2 // sprite name regex, attrName
    RandomValue: [argType.spriteNameRegex, argType.attrName],
}

const keys = ['space', 'left arrow', 'up arrow', 'right arrow', 'down arrow', 'enter', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i',
    'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

const placeholders = {
    spriteNameRegex: "",
    attrName: "",
    change: "",
    comp: "=",
    costumeName: "",
    value: "",
    functionC: "true",
    keyName: "space",
    r: "0",
    g: "0",
    b: "0",
    varNameRegex: "",
    expr: "",
    probValue: "0",
    time: "0",
    bool: "true",
    coordX: "0",
    coordY: "0"
}


export {argType, checkLabelCodes, inputLabelCodes, keys, placeholders};
