const test0 = async function (t) {
  t.inputImmediate({
    device: 'mouse',
    sprite: t.getSprite('Sprite1'),
    isDown: true,
    steps: 3
  });
  await t.runForSteps(1);
  t.inputImmediate({
    device: 'mouse',
    sprite: t.getSprite('Sprite1'),
    isDown: true,
    steps: 3
  });
  await t.runForSteps(1);
  t.inputImmediate({
    device: 'mouse',
    sprite: t.getSprite('Bear'),
    isDown: true,
    steps: 3
  });
  await t.runForSteps(1);
  t.inputImmediate({
    device: 'mouse',
    sprite: t.getSprite('Sprite1'),
    isDown: true,
    steps: 3
  });
  await t.runForSteps(1);
  await t.runForSteps(58);
  await t.runForSteps(1);
  t.inputImmediate({
    device: 'mouse',
    sprite: t.getSprite('Bear'),
    isDown: true,
    steps: 3
  });
  await t.runForSteps(1);
  t.inputImmediate({
    device: 'mouse',
    sprite: t.getSprite('Sprite1'),
    isDown: true,
    steps: 3
  });
  await t.runForSteps(1);
  t.inputImmediate({
    device: 'mouse',
    sprite: t.getSprite('Sprite1'),
    isDown: true,
    steps: 3
  });
  await t.runForSteps(1);
  t.inputImmediate({
    device: 'mouse',
    sprite: t.getSprite('Sprite1'),
    isDown: true,
    steps: 3
  });
  await t.runForSteps(1);
  t.inputImmediate({
    device: 'mouse',
    sprite: t.getSprite('Sprite1'),
    isDown: true,
    steps: 3
  });
  await t.runForSteps(1);
  t.inputImmediate({
    device: 'mouse',
    sprite: t.getSprite('Sprite1'),
    isDown: true,
    steps: 3
  });
  await t.runForSteps(1);
  await t.runForSteps(55);
  await t.runForSteps(1);
  await t.runForSteps(81);
  await t.runForSteps(1);
}

module.exports = [
  {
      test: test0,
      name: 'Generated Test',
      description: '',
      categories: []
  }
]
