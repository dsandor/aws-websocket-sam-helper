#!/usr/bin/env node

const SamHelper = require('./SamHelper');

async function doWork() {
  const funcDefs = await SamHelper.loadFunctionDefinitions('.');
  const apiDefs = await SamHelper.loadApiDefinitions();

  const samHelper = new SamHelper(apiDefs, funcDefs);
  const samTemplate = await samHelper.render();

  console.log('Generated sam template:\r\n');
  console.log(samTemplate);
}

doWork();