const test0 = async function (t) {
  await t.runForSteps(97);
  await t.runForSteps(1);
  await t.runForSteps(28);
  await t.runForSteps(1);
  await t.runForSteps(400);
  t.end();
}

module.exports = [
  {
      test: test0,
      name: 'Generated Test 0',
      description: '',
      categories: []
  }
]
