const boatVisible = async function (t) {
    let boat = t.getSprite('Boot');
    t.greenFlag()
    await t.runForTime(3);
    t.assert.ok(boat.visible, 'Boot must be visible');
    t.end();
}

const boatCostume = async function (t) {
    let boat = t.getSprite('Boot');
    t.greenFlag()
    await t.runForTime(3);
    t.assert.ok(boat.currentCostume === 0, 'boat must have the right costume');
    t.end();
}

const backdropInit = async function (t) {
    let stage = t.getStage();
    t.greenFlag()
    await t.runForTime(3);
    t.assert.ok(stage.currentCostume === 0, 'stage must have game backdrop');
    t.end();
}

const boatAtPosition = async function (t) {
    let boat = t.getSprite('Boot');
    t.greenFlag();
    t.mouseMove(-190, -150, 0);
    await t.runForTime(3);

    // If the functionality of moving the boat is implemented, the boat moves a little bit on
    // running this test. Therefore the test checks, if the boat is in a range between x:-187 - -191
    // and y:-148 - -151
    const isAroundX = boat.x <= -187 && boat.x >= -191;
    const isAroundY = boat.y <= -148 && boat.y >= -151;
    t.assert.ok(isAroundX && isAroundY, 'boat must be at point (-190, -150)');
    t.end();
}

const boatMoveUp = async function (t) {
    await t.runForTime(2);
    let boat = t.getSprite('Boot');
    t.greenFlag()
    await t.runForTime(4);
    let boatY = boat.y;
    t.mouseMove(boat.x, 100, 60);
    let positionChanged = false;
    t.addCallback(() => {
        if (!positionChanged && (boatY < boat.y)) {
            positionChanged = true;
        }
    }, true);
    await t.runUntil(() => positionChanged === true, 2000);
    t.assert.ok(positionChanged === true, 'Boat did not move');
    t.end();
};

const boatStopAfterMove = async function (t) {
    let boat = t.getSprite('Boot');
    t.greenFlag()
    await t.runForTime(2);
    let boatY = boat.y;
    t.mouseMove(boat.x, 100, 0);
    let positionChanged = false;
    t.addCallback(() => {
        if (!positionChanged && (boatY < boat.y)) {
            positionChanged = true;
        }
    }, true);
    await t.runUntil(() => positionChanged === true, 2000);
    t.assert.ok(positionChanged === true, 'Boat did not move');
    let touchedMouse = false;
    t.addCallback(() => {
        if (!touchedMouse && boat.isTouchingMouse()) {
            touchedMouse = true;
        }
    }, true);
    await t.runUntil(() => touchedMouse === true, 8000);
    t.assert.ok(touchedMouse === true, 'Boat did not touch mouse');
    let x = boat.x;
    let y = boat.y;
    let direction = boat.direction;
    await t.runForTime(10);
    t.assert.ok(x >= boat.x - 1 && x <= boat.x + 1, 'Boat did move x');
    t.assert.ok(y >= boat.y - 1 && y <= boat.y + 1, 'Boat did move y');
    t.assert.ok(direction >= boat.direction - 1 && direction <= boat.direction + 1, 'Boat did move direction');
    t.end();
};

const boatMoveRight = async function (t) {
    await t.runForTime(2);
    let boat = t.getSprite('Boot');
    t.greenFlag();
    await t.runForTime(4);
    let boatX = boat.x;
    let moved = false;
    t.onSpriteMoved(() => {
        if (!moved && boat.x > boatX) {
            moved = true;
        }
    });
    t.mouseMove(250, boat.y, 60);
    await t.runUntil(() => moved === true, 2000);
    t.assert.ok(moved === true, 'Boat did not move right');
    t.end();
};

const boatMoveLeft = async function (t) {
    await t.runForTime(2);
    let boat = t.getSprite('Boot');
    t.greenFlag();
    await t.runForTime(4);
    let boatX = boat.x;
    let moved = false;
    t.onSpriteMoved(() => {
        if (!moved && boat.x < boatX) {
            moved = true;
        }
    });
    t.mouseMove(-250, boat.y, 60);
    await t.runUntil(() => moved === true, 2000);
    t.assert.ok(moved === true, 'Boat did not move left');
    t.end();
};

const boatMoveDown = async function (t) {
    await t.runForTime(2);
    let boat = t.getSprite('Boot');
    t.greenFlag();
    await t.runForTime(4);
    let boatY = boat.y;
    let moved = false;
    t.onSpriteMoved(() => {
        if (!moved && boat.y < boatY) {
            moved = true;
        }
    });
    t.mouseMove(boat.x, -250, 60);
    await t.runUntil(() => moved === true, 2000);
    t.assert.ok(moved === true, 'Boat did not move down');
    t.end();
};

const crash = async function (t) {
    await t.runForTime(2);
    let boat = t.getSprite('Boot');
    t.greenFlag();
    await t.runForTime(4);
    let boatX = boat.x;
    let boatY = boat.y;
    let touchedWall = false;
    t.mouseMove(250, boat.y, 60);
    t.onSpriteMoved(() => {
        if (!touchedWall && boat.isTouchingColor([102, 59, 0])) {
            touchedWall = true;
            boatX = boat.x;
            boatY = boat.y;
        }
    });
    await t.runUntil(() => touchedWall === true, 20000);
    t.assert.ok(touchedWall === true, 'Boat did not touch wall');
}

const boatCrashStop = async function (t) {
    await crash(t);
    await t.runForTime(60);
    t.assert.ok(!t.isProjectRunning(), "project must not run");
    t.end();
};

const boatCrashCostume = async function (t) {
    await crash(t);
    await t.runForTime(10);
    let boat = t.getSprite('Boot');
    t.assert.ok(boat.currentCostume === 1, 'Boat did not change costume after touching wall ' + boat.currentCostume);
    t.end();
};

const boatCrashText = async function (t) {
    await crash(t);
    await t.runForTime(5);
    let boat = t.getSprite('Boot');
    t.assert.ok(boat.sayText.includes('Oh nein!'), 'Boat did not say text after touching wall');
    t.end();
};

const boatCrashBackdrop = async function (t) {
    await crash(t);
    await t.runForTime(5);
    let stage = t.getStage();
    t.assert.ok(stage.currentCostume === 2, 'stage must have game over backdrop');
    t.end();
};

const boatCrashReset = async function (t) {
    await crash(t);
    await t.runForTime(10);
    let boat = t.getSprite('Boot');
    const isAroundX = boat.x <= -187 && boat.x >= -191;
    const isAroundY = boat.y <= -148 && boat.y >= -151;
    t.assert.ok(isAroundX && isAroundY, 'boat is not reset to (-190, -150)');
    t.end();
};

const boatCrashOtherInvisible = async function (t) {
    await crash(t);
    await t.runForTime(10);
    let crab = t.getSprite('Krebs');
    t.assert.ok(!crab.visible, 'Crab did not turn invisible');
    let gate = t.getSprite('Holzdrehtor');
    t.assert.ok(!gate.visible, 'gate did not turn invisible');
    t.end();
};

const winning = async function (t) {
    t.greenFlag();
    t.mouseMove(190, -140, 90);
    await t.runForTime(3);
    t.dragSprite('Boot', 90, -120);
    let boat = t.getSprite('Boot');
    let touchedIsland = false;
    t.mouseMove(190, -140, 90);
    t.onSpriteMoved(() => {
        if (!touchedIsland && boat.isTouchingColor([255, 255, 153])) {
            touchedIsland = true;
        }
    });
    await t.runUntil(() => touchedIsland === true, 5000);
}

const boatIsWinningStop = async function (t) {
    await winning(t);
    await t.runForTime(60);
    t.assert.ok(!t.isProjectRunning(), "project must not run");
    t.end();
}

const boatIsWinningText = async function (t) {
    await winning(t);
    await t.runForTime(30);
    let boat = t.getSprite('Boot');
    t.assert.ok(boat.sayText.startsWith('Yeah'), 'Boat did not win the game after touching island ' + boat.sayText);
    t.end();
}

const boatIsWinningBackdrop = async function (t) {
    await winning(t);
    await t.runForTime(30);
    let stage = t.getStage();
    t.assert.ok(stage.currentCostume === 1, 'stage must have win backdrop');
    t.end();
}

const boatIsWinningReset = async function (t) {
    await winning(t);
    await t.runForTime(30);
    let boat = t.getSprite('Boot');
    const isAroundX = boat.x <= -187 && boat.x >= -191;
    const isAroundY = boat.y <= -148 && boat.y >= -151;
    t.assert.ok(isAroundX && isAroundY, 'boat is not reset to (-190, -150)');
    t.end();
}

const boatIsWinningOtherInvisible = async function (t) {
    await winning(t);
    await t.runForTime(30);
    let crab = t.getSprite('Krebs');
    t.assert.ok(!crab.visible, 'Crab did not turn invisible');
    let gate = t.getSprite('Holzdrehtor');
    t.assert.ok(!gate.visible, 'gate did not turn invisible');
    t.end();
};

const gateVisible = async function (t) {
    let gate = t.getSprite('Holzdrehtor');
    t.greenFlag();
    await t.runForTime(3);
    t.assert.ok(gate.visible, 'Gate must be visible');
    t.end();
}

const crabVisible = async function (t) {
    let crab = t.getSprite('Krebs');
    t.greenFlag();
    await t.runForTime(3);
    t.assert.ok(crab.visible, 'Crab must be visible');
    t.end();
}

const gateSpinning = async function (t) {
    let gate = t.getSprite('Holzdrehtor');
    t.greenFlag();
    let oldDirection = gate.direction;
    let directionChanged = false;
    t.addCallback(() => {
        if (!directionChanged && oldDirection !== gate.direction) {
            directionChanged = true;
        }
    }, true);
    await t.runUntil(() => directionChanged === true, 2000);
    t.assert.ok(directionChanged, 'gate has to spin.');
    t.end();
}

const gateCrash = async function (t) {
    await t.runForTime(2);
    let boat = t.getSprite('Boot');
    let gate = t.getSprite('Holzdrehtor');
    t.greenFlag();
    await t.runForTime(3);
    t.dragSprite('Boot', 90, -120);
    let touchedGate = false;
    t.mouseMove(gate.x, gate.y, 60);
    t.onSpriteMoved(() => {
        if (!touchedGate && boat.isTouchingSprite(gate.name)) {
            touchedGate = true;
        }
    });
    await t.runUntil(() => touchedGate === true, 20000);
    t.assert.ok(touchedGate === true, 'Boat did not touch gate');
}

const boatCrashGateStop = async function (t) {
    await gateCrash(t);
    await t.runForTime(60);
    t.assert.ok(!t.isProjectRunning(), "project must not run");
    t.end();
};

const boatCrashGateCostume = async function (t) {
    await gateCrash(t);
    await t.runForTime(10);
    let boat = t.getSprite('Boot');
    t.assert.ok(boat.currentCostume === 1, 'Boat did not change costume after touching gate ' + boat.currentCostume);
    t.end();
};

const boatCrashGateText = async function (t) {
    await gateCrash(t);
    await t.runForTime(5);
    let boat = t.getSprite('Boot');
    t.assert.ok(boat.sayText.includes('Oh nein!'), 'Boat did not say text after touching gate');
    t.end();
};

const boatCrashGateBackdrop = async function (t) {
    await gateCrash(t);
    await t.runForTime(5);
    let stage = t.getStage();
    t.assert.ok(stage.currentCostume === 2, 'stage must have game over backdrop');
    t.end();
};

const boatCrashGateReset = async function (t) {
    await gateCrash(t);
    await t.runForTime(10);
    let boat = t.getSprite('Boot');
    const isAroundX = boat.x <= -187 && boat.x >= -191;
    const isAroundY = boat.y <= -148 && boat.y >= -151;
    t.assert.ok(isAroundX && isAroundY, 'boat is not reset to (-190, -150)');
    t.end();
};

const boatCrashGateOtherInvisible = async function (t) {
    await gateCrash(t);
    await t.runForTime(15);
    let crab = t.getSprite('Krebs');
    t.assert.ok(!crab.visible, 'Crab did not turn invisible');
    let gate = t.getSprite('Holzdrehtor');
    t.assert.ok(!gate.visible, 'gate did not turn invisible');
    t.end();
};

const boatTouchingArrow = async function (t) {
    let boat = t.getSprite('Boot');
    t.greenFlag()
    await t.runForTime(10);
    let touched = false;
    t.onSpriteMoved(() => {
        if (!touched && boat.isTouchingColor([255, 255, 255])) {
            touched = true;
        }
    });
    t.mouseMove(-205, 8, 0);
    await t.runUntil(() => touched === true, 5000);
    t.assert.ok(touched === true, 'Boat did not touch arrow');
    let boatY = boat.y;
    let boatX = boat.x;
    await t.runForTime(1);
    let boatNewY = boat.y;
    let boatNewX = boat.x;
    let distance = Math.sqrt((boatNewX - boatX) * (boatNewX - boatX) + (boatNewY - boatY) * (boatNewY - boatY));
    t.assert.ok(distance >= 3, 'Boat did not move at least 4');
    t.end();
};

const boatTouchingSlime = async function (t) {
    let boat = t.getSprite('Boot');
    t.greenFlag()
    let touched = false;
    t.onSpriteMoved(() => {
        if (!touched && boat.isTouchingColor([92, 229, 129])) {
            touched = true;
        }
    });
    t.mouseMove(-190, 140, 0);
    await t.runUntil(() => touched === true, 10000);
    t.assert.ok(touched === true, 'Boat did not touch slime');
    let boatY = boat.y;
    let boatX = boat.x;
    t.mouseMove(-190, 141, 0);
    await t.runForTime(1);
    let boatNewY = boat.y;
    let boatNewX = boat.x;
    let distance = Math.sqrt((boatNewX - boatX) * (boatNewX - boatX) + (boatNewY - boatY) * (boatNewY - boatY));
    t.assert.ok(distance < 2, 'Boat did move more  2 ');
    t.end();
};

const boatTouchingCrabMove = async function (t) {
    let crab = t.getSprite('Krebs');
    t.greenFlag()
    await t.runForTime(3);
    let boat = t.getSprite('Boot');
    t.dragSprite('Krebs', boat.x - 10, 0);
    let oldX = crab.x;
    let oldY = crab.y;
    let touched = false;
    t.onSpriteMoved(() => {
        if (!touched && boat.isTouchingSprite(crab.name)) {
            touched = true;
        }
    });
    t.mouseMove(crab.x, crab.y, 0);
    await t.runUntil(() => touched === true, 10000);
    t.assert.ok(touched, 'Boat did not touch crab');
    await t.runForTime(5);
    console.log('oldX ' + oldX + ' oldY ' + oldY + ' x ' + crab.x + ' y ' + crab.y);
    t.assert.ok(oldX !== crab.x || oldY !== crab.y, 'crab did not change position');
    t.end();
}

module.exports = [
    {
        test: boatVisible,
        name: 'boat visible',
        description: '',
        categories: []
    }, {
        test: gateVisible,
        name: 'gate visible',
        description: '',
        categories: []
    }, {
        test: crabVisible,
        name: 'crab visible',
        description: '',
        categories: []
    }, {
        test: boatCostume,
        name: 'boat costume',
        description: '',
        categories: []
    }, {
        test: backdropInit,
        name: 'stage game backdrop',
        description: '',
        categories: []
    },
    {
        test: boatAtPosition,
        name: 'boat at start position',
        description: '',
        categories: []
    }, {
        test: gateSpinning,
        name: 'gate spinning',
        description: '',
        categories: []
    },
    {
        test: boatMoveUp,
        name: 'boat move up',
        description: '',
        categories: []
    },
    {
        test: boatMoveLeft,
        name: 'boat move left',
        description: '',
        categories: []
    },
    {
        test: boatMoveRight,
        name: 'boat move right',
        description: '',
        categories: []
    },
    {
        test: boatMoveDown,
        name: 'boat move down',
        description: '',
        categories: []
    },
    {
        test: boatCrashStop,
        name: 'boat crash stop',
        description: '',
        categories: []
    },
    {
        test: boatCrashCostume,
        name: 'boat crash costume',
        description: '',
        categories: []
    },
    {
        test: boatCrashText,
        name: 'boat crash text',
        description: '',
        categories: []
    },
    {
        test: boatCrashBackdrop,
        name: 'boat crash backdrop',
        description: '',
        categories: []
    },
    {
        test: boatCrashOtherInvisible,
        name: 'boat crash other invisible',
        description: '',
        categories: []
    },
    {
        test: boatIsWinningStop,
        name: 'boat winning stop',
        description: '',
        categories: []
    },
    {
        test: boatIsWinningText,
        name: 'boat winning text',
        description: '',
        categories: []
    },
    {
        test: boatIsWinningBackdrop,
        name: 'boat winning backdrop',
        description: '',
        categories: []
    },
    {
        test: boatIsWinningOtherInvisible,
        name: 'boat winning other invisible',
        description: '',
        categories: []
    },
    {
        test: boatCrashGateStop,
        name: 'boat crash gate stop',
        description: '',
        categories: []
    },
    {
        test: boatCrashGateCostume,
        name: 'boat crash gate costume',
        description: '',
        categories: []
    },
    {
        test: boatCrashGateText,
        name: 'boat crash gate text',
        description: '',
        categories: []
    },
    {
        test: boatCrashGateBackdrop,
        name: 'boat crash gate backdrop',
        description: '',
        categories: []
    },
    {
        test: boatCrashGateOtherInvisible,
        name: 'boat crash other invisible',
        description: '',
        categories: []
    },
    {
        test: boatStopAfterMove,
        name: 'boat stop after move',
        description: '',
        categories: []
    },
    {
        test: boatTouchingArrow,
        name: 'boat touching arrow',
        description: '',
        categories: []
    },
    {
        test: boatTouchingSlime,
        name: 'boat touching slime',
        description: '',
        categories: []
    },
    {
        test: boatTouchingCrabMove,
        name: 'boat touching crab move',
        description: '',
        categories: []
    },
    {
        test: boatCrashGateReset,
        name: 'boat crash gate reset',
        description: '',
        categories: []
    },
    {
        test: boatCrashReset,
        name: 'boat crash reset',
        description: '',
        categories: []
    },
    {
        test: boatIsWinningReset,
        name: 'boat winning reset',
        description: '',
        categories: []
    }
];
