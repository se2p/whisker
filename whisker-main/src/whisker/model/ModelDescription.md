![Whisker Logo](logos/whisker-text-logo.png)

Whisker is an automated testing framework for [Scratch](https://scratch.mit.edu/) projects.

Model-based testing in Scratch defines the program and/or user behavior in models to test an implementation by parallel
execution of model and project.

## Graph structure

Following structure is needed in the JSON file:

```json
{
    "usage": "program|end|user",
    "id": "IDNAME",
    "startNodeId": "NODE_NAME",
    "stopNodeIds": [
        "STOP_NODE_ID0",
        "STOP_NODE_ID1",
        "..."
    ],
    "stopAllNodeIds": [
        "STOP_NODE_ID0",
        "STOP_NODE_ID1",
        "..."
    ],
    "nodes": [
        {
            "id": "init",
            "label": "init"
        },
        {
            "id": "start",
            "label": "start"
        },
        {
            "id": "text",
            "label": "text"
        },
        {
            "id": "end",
            "label": "end"
        }
    ],
    "edges": [
        {
            "id": "EDGE_ID",
            "from": "NODE_ID",
            "to": "NODE_ID",
            "forceTestAfter": -1,
            "forceTestAt": -1,
            "conditions": [
                {
                    "id": "SOME_ID",
                    "name": "CHECK_NAME",
                    "args": [
                        "ARG0",
                        "ARG1"
                    ],
                    "negated": false
                }
            ],
            "effects": [
                {
                    "id": "SOME_ID",
                    "name": "CHECK_NAME|INPUT_EFFECT_NAME(user model)",
                    "args": [
                        "ARG0",
                        "ARG1"
                    ],
                    "negated": false
                }
            ]
        }
    ]
}
```

## Alternative

This structure is also allowed (for shorter node definitions). This creates node labels that equal its id when loading
in.

```json
{
    "usage": "program|end|user",
    "id": "IDNAME",
    "startNodeId": "NODE_NAME",
    "stopNodeIds": [
        "STOP_NODE_ID0",
        "STOP_NODE_ID1",
        "..."
    ],
    "stopAllNodeIds": [
        "STOP_NODE_ID0",
        "STOP_NODE_ID1",
        "..."
    ],
    "nodeIds": [
        "NODE_ID0",
        "NODE_ID1",
        "..."
    ],
    "edges": []
}
```

## Edge timings

The attributes 'forceTestAt' and 'forceTestAfter' of edges are timing conditions. -1 as default value, when not needed.
Examples
<ul>
    <li>forceTestAt: 30000. Forces the test of the edge's condition after 30s since game start.</li>
    <li>forceTestAfter: 1000. Forces the test of the edge's condition after 1s after the last edge transition in the
        same model.</li>
</ul>

## Check Name and Arguments for Edges

Following conditions can be added to any edge:

<ul>
    <li>AttrChange: change in an attributes value (sprite name as Regex, attribute name, change)  </li>
    <li>AttrComp: attribute comparison (sprite name as Regex, attribute name, comparison, value to compare to </li>
    <li>BackgroundChange: Change background (new background name) </li>
    <li>Click: A sprite is clicked. (sprite name as Regex) </li>
    <li>Function: A JS Function (the function) </li>
    <li>Key: A key press (key name) </li>
    <li>Output: Sprite has a speech bubble (sprite name as regex, EXPR) </li>
    <li>SpriteColor: Sprite is on color (sprite name as regex, red, green, blue values) </li>
    <li>SpriteTouching: two sprites touching each other (two sprite names regex) </li>
    <li>VarChange: change in a variable value (sprite name regex, var name regex, change) </li>
    <li>VarComp: variable comparison (sprite name as regex, variable name as regex, comparison, value to compare to</li>
    <li>Expr: evaluate an expression (EXPR) </li>
    <li>Probability: for randomness, e.g. take an edge with probability 0.5. Depends on edge ordering.(probability)</li>
    <li>TimeElapsed: time from the test start on (time in milliseconds) </li>
    <li>TimeBetween: time from the last edge transition in the model (time in milliseconds) </li>
    <li>TimeAfterEnd: time from program end (for after end models) (time in milliseconds) </li>
    <li>NbrOfClones: Tests the number of clones by comparison (sprite name regex, comparison, number) </li>
    <li>NbrOfVisibleClones: Tests the number of visible clones by comparison (sprite name regex, comparison, number)
        </li>
    <li>TouchingEdge: Whether a sprite touches an edge of the canvas. (sprite name regex) </li>
    <li>TouchingVerticalEdge:  Whether a sprite touches a vertical edge of the canvas (sprite name regex) </li>
    <li>TouchingHorizEdge:  Whether a sprite touches a horizontal edge of the canvas. (sprite name regex) </li>
    <li>RandomValue: Checks that the last three values of the attribute are random. (sprite name regex, attrribute
        name)</li>
</ul>

Spezial arguments:
<ul>
    <li>Change: + | - | = | += | -= | +number | number | -number</li>
    <li>Comparison: = | == | > | >= | < | <= </li>
<li>EXPR: Eine Expression ist eine Kurznotation für eine JavaScript Funktion. Attribute und Variable von Sprites
können mit $(Sprite.Attr/Var) abgerufen werden. Beispiel: $(Cat.x)>100" oder Math.abs($(Bowl.x))</li>
</ul>

## Input Effect Checks and Arguments

<ul>
    <li>InputClickSprite: Click a sprite (sprite name regex)</li>
    <li>InputClickStage: Click the stage. </li>
    <li>InputKey: Press a key for one Whisker step (key name) </li>
    <li>InputMouseDown: Whether the mouse is down. (true | false) </li>
    <li>InputMouseMove: Move the mouse to (x, y) </li>
    <li>InputText: Input a text (text)</li>
</ul>
