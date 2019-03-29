const SamHelper = require('./SamHelper');

async function doWork() {
  const funcDefs = await SamHelper.loadFunctionDefinitions('.');
  console.log(funcDefs);

  const apiDefs = await SamHelper.loadApiDefinitions();
  console.log(apiDefs);

  const samHelper = new SamHelper(apiDefs, funcDefs);

  const samTemplate = await samHelper.render();

  console.log(samTemplate);
}

doWork();