const test0 = async function (t) {
  await t.runForSteps(21);
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
  await t.runForSteps(61);
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
  await t.runForSteps(52);
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
  await t.runForSteps(97);
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
    sprite: t.getSprite('Bear'),
    isDown: true,
    steps: 3
  });
  await t.runForSteps(1);
  await t.runForSteps(95);
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
}

module.exports = [
  {
      test: test0,
      name: 'Generated Test',
      description: '',
      categories: []
  }
]
