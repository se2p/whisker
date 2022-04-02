const test0 = async function (t) {
  await t.runForSteps(58);
  await t.runForSteps(1);
  t.mouseMove(90, 36);
  await t.runForSteps(1);
  t.mouseMove(221, -145);
  await t.runForSteps(1);
  t.mouseMove(230, -100);
  await t.runForSteps(1);
  t.mouseMove(-161, 10);
  await t.runForSteps(1);
  t.mouseMove(206, -94);
  await t.runForSteps(1);
  await t.runForSteps(32);
  await t.runForSteps(1);
  t.mouseMove(177, -146);
  await t.runForSteps(1);
  await t.runForSteps(21);
  await t.runForSteps(1);
  t.mouseMove(-176, -96);
  await t.runForSteps(1);
  await t.runForSteps(25);
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
