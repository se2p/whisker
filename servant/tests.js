const test0 = async function (t) {
  t.keyPress('right arrow', 1);
  await t.runForSteps(1);
  await t.runForSteps(1);
  await t.runForSteps(81);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Apple").x, 143, 5, "Expected Sprite Apple to have x-position 143 +-5");
  t.assert.withinRange(t.getSprite("Apple").y, -155, 5, "Expected Sprite Apple to have y-position -155 +-5");
  t.assert.withinRange(t.getSprite("Bananas").x, 116, 5, "Expected Sprite Bananas to have x-position 116 +-5");
  t.assert.withinRange(t.getSprite("Bananas").y, 93, 5, "Expected Sprite Bananas to have y-position 93 +-5");
  t.assert.equal(t.getSprite("Apple").sayText, "Game over!", "Expected Sprite Apple to say Game over!");
  t.assert.equal(t.getStage().getVariable("Punkte", false).value, "8", "Expected Punkte to have value 8");
  t.assert.equal(t.getStage().getVariable("Zeit", false).value, "28", "Expected Zeit to have value 28");
  t.assert.ok(t.getSprite("Bananas").visible, "Expected Sprite Bananas to be visible");
  t.dragSprite('Bananas', 10, -145, null);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Bananas").x, -175, 5, "Expected Sprite Bananas to have x-position -175 +-5");
  t.assert.withinRange(t.getSprite("Bananas").y, 170, 5, "Expected Sprite Bananas to have y-position 170 +-5");
  t.assert.equal(t.getStage().getVariable("Punkte", false).value, "16", "Expected Punkte to have value 16");
  t.dragSprite('Bananas', -234, -170, null);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Bananas").x, -234, 5, "Expected Sprite Bananas to have x-position -234 +-5");
  t.assert.withinRange(t.getSprite("Bananas").y, -177, 5, "Expected Sprite Bananas to have y-position -177 +-5");
  t.assert.equal(t.getSprite("Bananas").sayText, "-8", "Expected Sprite Bananas to say -8");
  t.assert.equal(t.getStage().getVariable("Punkte", false).value, "8", "Expected Punkte to have value 8");
  t.dragSprite('Apple', 38.940434177820364, -155.25539686540043, null);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Apple").x, 38.940434177820364, 5, "Expected Sprite Apple to have x-position 38.940434177820364 +-5");
  t.assert.withinRange(t.getSprite("Apple").y, -155.25539686540043, 5, "Expected Sprite Apple to have y-position -155.25539686540043 +-5");
  await t.runForSteps(85);
  await t.runForSteps(1);
  t.assert.not(t.getSprite("Apple").sayText, "Expected Sprite Apple not to say anything");
  t.assert.not(t.getSprite("Bananas").sayText, "Expected Sprite Bananas not to say anything");
  t.assert.equal(t.getStage().getVariable("Zeit", false).value, "27", "Expected Zeit to have value 27");
  t.end();
}
const test1 = async function (t) {
  t.dragSprite('Bananas', -205.29129024160858, -180, null);
  await t.runForSteps(1);
  t.keyPress('left arrow', 1);
  await t.runForSteps(1);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Bowl").x, -10, 5, "Expected Sprite Bowl to have x-position -10 +-5");
  t.assert.withinRange(t.getSprite("Bowl").y, -145, 5, "Expected Sprite Bowl to have y-position -145 +-5");
  t.assert.withinRange(t.getSprite("Apple").x, 143, 5, "Expected Sprite Apple to have x-position 143 +-5");
  t.assert.withinRange(t.getSprite("Apple").y, 155, 5, "Expected Sprite Apple to have y-position 155 +-5");
  t.keyPress('left arrow', 1);
  await t.runForSteps(1);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Bowl").x, -20, 5, "Expected Sprite Bowl to have x-position -20 +-5");
  t.assert.withinRange(t.getSprite("Bowl").y, -145, 5, "Expected Sprite Bowl to have y-position -145 +-5");
  t.assert.withinRange(t.getSprite("Apple").x, 143, 5, "Expected Sprite Apple to have x-position 143 +-5");
  t.assert.withinRange(t.getSprite("Apple").y, 145, 5, "Expected Sprite Apple to have y-position 145 +-5");
  t.keyPress('left arrow', 4);
  await t.runForSteps(4);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Bowl").x, -60, 5, "Expected Sprite Bowl to have x-position -60 +-5");
  t.assert.withinRange(t.getSprite("Bowl").y, -145, 5, "Expected Sprite Bowl to have y-position -145 +-5");
  t.assert.withinRange(t.getSprite("Apple").x, 143, 5, "Expected Sprite Apple to have x-position 143 +-5");
  t.assert.withinRange(t.getSprite("Apple").y, 120, 5, "Expected Sprite Apple to have y-position 120 +-5");
  t.keyPress('right arrow', 4);
  await t.runForSteps(4);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Bowl").x, -20, 5, "Expected Sprite Bowl to have x-position -20 +-5");
  t.assert.withinRange(t.getSprite("Bowl").y, -145, 5, "Expected Sprite Bowl to have y-position -145 +-5");
  t.assert.withinRange(t.getSprite("Apple").x, 143, 5, "Expected Sprite Apple to have x-position 143 +-5");
  t.assert.withinRange(t.getSprite("Apple").y, 95, 5, "Expected Sprite Apple to have y-position 95 +-5");
  t.keyPress('right arrow', 2);
  await t.runForSteps(2);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Bowl").x, 0, 5, "Expected Sprite Bowl to have x-position 0 +-5");
  t.assert.withinRange(t.getSprite("Bowl").y, -145, 5, "Expected Sprite Bowl to have y-position -145 +-5");
  t.assert.withinRange(t.getSprite("Apple").x, 143, 5, "Expected Sprite Apple to have x-position 143 +-5");
  t.assert.withinRange(t.getSprite("Apple").y, 80, 5, "Expected Sprite Apple to have y-position 80 +-5");
  t.dragSprite('Apple', -6.3637613878678225, -175.81165315445185, null);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Apple").x, -2, 5, "Expected Sprite Apple to have x-position -2 +-5");
  t.assert.withinRange(t.getSprite("Apple").y, 170, 5, "Expected Sprite Apple to have y-position 170 +-5");
  t.assert.equal(t.getStage().getVariable("Punkte", false).value, "5", "Expected Punkte to have value 5");
  await t.runForSteps(74);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Apple").x, -175, 5, "Expected Sprite Apple to have x-position -175 +-5");
  t.assert.withinRange(t.getSprite("Apple").y, 80, 5, "Expected Sprite Apple to have y-position 80 +-5");
  t.assert.withinRange(t.getSprite("Bananas").x, 64, 5, "Expected Sprite Bananas to have x-position 64 +-5");
  t.assert.withinRange(t.getSprite("Bananas").y, -152, 5, "Expected Sprite Bananas to have y-position -152 +-5");
  t.assert.equal(t.getSprite("Bananas").sayText, "-8", "Expected Sprite Bananas to say -8");
  t.assert.equal(t.getStage().getVariable("Punkte", false).value, "2", "Expected Punkte to have value 2");
  t.assert.equal(t.getStage().getVariable("Zeit", false).value, "27", "Expected Zeit to have value 27");
  t.assert.ok(t.getSprite("Bananas").visible, "Expected Sprite Bananas to be visible");
  t.keyPress('right arrow', 4);
  await t.runForSteps(4);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Bowl").x, 40, 5, "Expected Sprite Bowl to have x-position 40 +-5");
  t.assert.withinRange(t.getSprite("Bowl").y, -145, 5, "Expected Sprite Bowl to have y-position -145 +-5");
  t.assert.withinRange(t.getSprite("Apple").x, -175, 5, "Expected Sprite Apple to have x-position -175 +-5");
  t.assert.withinRange(t.getSprite("Apple").y, 55, 5, "Expected Sprite Apple to have y-position 55 +-5");
  t.dragSprite('Apple', -240, -180, null);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Apple").x, -240, 5, "Expected Sprite Apple to have x-position -240 +-5");
  t.assert.withinRange(t.getSprite("Apple").y, -180, 5, "Expected Sprite Apple to have y-position -180 +-5");
  t.assert.equal(t.getSprite("Apple").sayText, "Game over!", "Expected Sprite Apple to say Game over!");
  t.keyPress('left arrow', 2);
  await t.runForSteps(2);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Bowl").x, 20, 5, "Expected Sprite Bowl to have x-position 20 +-5");
  t.assert.withinRange(t.getSprite("Bowl").y, -145, 5, "Expected Sprite Bowl to have y-position -145 +-5");
  t.keyPress('left arrow', 4);
  await t.runForSteps(4);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Bowl").x, -20, 5, "Expected Sprite Bowl to have x-position -20 +-5");
  t.assert.withinRange(t.getSprite("Bowl").y, -145, 5, "Expected Sprite Bowl to have y-position -145 +-5");
  t.assert.withinRange(t.getSprite("Bananas").x, 205, 5, "Expected Sprite Bananas to have x-position 205 +-5");
  t.assert.withinRange(t.getSprite("Bananas").y, 170, 5, "Expected Sprite Bananas to have y-position 170 +-5");
  t.assert.not(t.getSprite("Bananas").sayText, "Expected Sprite Bananas not to say anything");
  t.assert.not(t.getSprite("Bananas").visible, "Expected Sprite Bananas not to be visible");
  t.keyPress('left arrow', 3);
  await t.runForSteps(3);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Bowl").x, -50, 5, "Expected Sprite Bowl to have x-position -50 +-5");
  t.assert.withinRange(t.getSprite("Bowl").y, -145, 5, "Expected Sprite Bowl to have y-position -145 +-5");
  t.dragSprite('Apple', -50, -145, null);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Apple").x, -50, 5, "Expected Sprite Apple to have x-position -50 +-5");
  t.assert.withinRange(t.getSprite("Apple").y, -145, 5, "Expected Sprite Apple to have y-position -145 +-5");
  t.dragSprite('Bananas', -234, -170, null);
  await t.runForSteps(1);
  t.assert.withinRange(t.getSprite("Bananas").x, -234, 5, "Expected Sprite Bananas to have x-position -234 +-5");
  t.assert.withinRange(t.getSprite("Bananas").y, -170, 5, "Expected Sprite Bananas to have y-position -170 +-5");
  await t.runForSteps(54);
  await t.runForSteps(1);
  t.assert.not(t.getSprite("Apple").sayText, "Expected Sprite Apple not to say anything");
  t.assert.equal(t.getStage().getVariable("Zeit", false).value, "26", "Expected Zeit to have value 26");
  t.end();
}

module.exports = [
  {
      test: test0,
      name: 'Generated Test',
      description: '',
      categories: [],
      generationAlgorithm: 'mio',
      seed: '1690450961758',
      type: 'standard',
  },
  {
      test: test1,
      name: 'Generated Test',
      description: '',
      categories: [],
      generationAlgorithm: 'mio',
      seed: '1690450961758',
      type: 'standard',
  }
]
