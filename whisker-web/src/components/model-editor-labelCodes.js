// for building model-editor checks, should equal CheckName.ts in model and InputEffectName in InputEffect.ts

const argType = {
    spriteName: 'spriteName',
    attrName: 'attrName',
    change: 'change',
    comp: 'comp',
    costumeName: 'costumeName',
    value: 'value',
    keyName: 'keyName',
    r: 'r',
    g: 'g',
    b: 'b',
    varName: 'varName',
    expr: 'expr',
    probValue: 'probValue',
    time: 'time',
    bool: 'bool',
    coordX: 'coordX',
    coordY: 'coordY',
    layerSelection: 'firstOrLastLayer'
};

const inputLabelCodes = {
    // sprite name
    InputClickSprite: [argType.spriteName],
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
};

const checkLabelCodes = {
    // 3 args:  sprite name, attr name, ( + | - | = | += | -= | +<number> | <number> | -<number>)
    AttrChange: [argType.spriteName, argType.attrName, argType.change],
    // 4 args: sprite name, attribute name, comparison (=,>,<...), value to compare to
    AttrComp: [argType.spriteName, argType.attrName, argType.comp, argType.value],
    // 1 arg: new background name
    BackgroundChange: [argType.costumeName],
    // 1 args: sprite name
    Click: [argType.spriteName],
    // 1 args: key name
    Key: [argType.keyName],
    // 2 sprite name, string output
    Output: [argType.spriteName, argType.expr],
    // 4  args: sprite name, red, green, blue values
    SpriteColor: [argType.spriteName, argType.r, argType.g, argType.b],
    // 2  args: two sprite names
    SpriteTouching: [argType.spriteName, argType.spriteName],
    // 3 sprite name, var name, ( + | - | = | += | -= |+<number> | <number> |-<number>)
    VarChange: [argType.spriteName, argType.varName, argType.change],
    // 4 args: sprite name, variable name, comparison (=,>,<...), value to compare to
    VarComp: [argType.spriteName, argType.varName, argType.comp, argType.value],
    // 1  evaluate an expression, args: expression
    Expr: [argType.expr],
    // 1 for randomness, percentage
    Probability: [argType.probValue],
    // 1 // time from the test start on, time in milliseconds
    TimeElapsed: [argType.time],
    // 1 //  time from the last edge transition in the model, in milliseconds
    TimeBetween: [argType.time],
    // 1 // time from program end (for after end models)
    TimeAfterEnd: [argType.time],
    // 3 // sprite name, comparison, number
    NbrOfClones: [argType.spriteName, argType.comp, argType.value],
    // 3 // sprite name, comparison, number
    NbrOfVisibleClones: [argType.spriteName, argType.comp, argType.value],
    // 1 // sprite name regex
    TouchingEdge: [argType.spriteName],
    // 1 // sprite name regex
    TouchingVerticalEdge: [argType.spriteName],
    // 1 // sprite name regex
    TouchingHorizEdge: [argType.spriteName],
    // 2 // sprite name regex, selected layer
    Layer: [argType.spriteName, argType.layerSelection],
    // 2 // sprite name regex, target (sprite or mouse pointer)
    PointsTo: [argType.spriteName, argType.spriteName],
    // 1 // sprite name regex
    ClearedEffects: [argType.spriteName],
    // 0
    AnyKey: []
};

const placeholders = {
    spriteNameRegex: '',
    attrName: '',
    change: '',
    comp: '=',
    costumeName: '',
    value: '',
    keyName: 'space',
    r: '0',
    g: '0',
    b: '0',
    varNameRegex: '',
    expr: '',
    probValue: '0',
    time: '0',
    bool: 'true',
    coordX: '0',
    coordY: '0',
    layerSelection: 'First or Last'
};

export {argType, checkLabelCodes, inputLabelCodes, placeholders};
