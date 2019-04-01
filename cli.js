#!/usr/bin/env node
const program = require('commander');
const pkg = require('./package.json');

program
  .version(pkg.version)
  .option('-t, --template-path [templatePath]')
  .option('--no-write-file', 'Only outputs the rendered template to the console.', 'false')
  //.option('-s --silent', 'Output nothing to the command line.', 'false')
  .option('--output-filename [outputFilename]', 'The filename to write the template yaml.', 'template.yaml')
  .option('--starting-path [startingPath]', 'The path to start searching for function.json files.', '.')
  .option('--api-definition-file [apiDefinitionFile]', 'Api definition file. If not specified package.json is used.')
  .parse(process.argv);

const SamHelper = require('./SamHelper');

async function doWork() {
  const funcDefs = await SamHelper.loadFunctionDefinitions(program.startingPath);
  const apiDefs = await SamHelper.loadApiDefinitions(
    {
      usePackageJson: !program.apiDefinitionFile,
      apiDefinitionFile: program.apiDefinitionFile
    });

  const samHelper = new SamHelper(apiDefs, funcDefs, {
    outputFilename: program.outputFilename,
    writeFile: program.writeFile,
    templatePath: program.templatePath
  });

  const samTemplate = await samHelper.render();

  console.log('Generated sam template:\r\n');
  console.log(samTemplate);
}

doWork();