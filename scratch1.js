const fs = require('fs-extra');
const Handlebars = require('handlebars');
const path = require('path');

const mockFunctionDescriptions = [
  { functionName: 'GetUserFunction', routeKey: 'get-user', apiId: 'MyApi' },
  { functionName: 'SaveUserFunction', routeKey: 'save-user', apiId: 'MyApi' },
];

const mockApiDescriptions = [
  {
    apiId: 'MyApi',
    apiName: 'my-api',
    stageName: 'v1',
    stageDescription: 'Version 1 of the api.',
    routeSelectionExpression: '$request.body.action',
    type: 'websocket', // valid: websocket | rest
  },
];

Handlebars.registerHelper('functionNameList', (items) => {
  return items.map((i) => `      - ${i.functionName}`).join('\r\n')
});

Handlebars.registerHelper('routeList', (functions) => {
  return items.map((i) => `      - ${i.functionName}`).join('\r\n')
});

Handlebars.registerHelper('safeVal', function (value, safeValue) {
  var out = value || safeValue;
  return new Handlebars.SafeString(out);
});

async function loadTemplates() {
  const templatePath = path.join(__dirname, 'templates');
  const files = await fs.readdir(templatePath);
  const templates = await files.reduce(async (prev, curr) => {
    const templateFilePath = path.join(templatePath, curr);
    const source = await fs.readFile(templateFilePath, { encoding: 'utf8' });
    const template = Handlebars.compile(source);

    const prevValue = await prev;
    prevValue[path.basename(curr.toLowerCase(), '.yaml')] = { templateFilePath, source, template };
    return prevValue;
  }, {});

  return templates;
}

async function doWork(apis) {
  const templates = await loadTemplates();

  const apiDescriptions = [];
  for(let apiDescription of apis) {
    // find each api, add related functions to api description.
    apiDescription.functions = mockFunctionDescriptions.filter((f) => f.apiId === apiDescription.apiId);
    apiDescriptions.push(apiDescription);
  }


  // const testApi = templates['websocket-api'].template(apiDescriptions[0]);
  //
  // console.log(testApi);
  //
  // const testRoute = templates['websocket-route'].template(mockFunctionDescriptions[0]);
  //
  // console.log('testRoute:', testRoute);

  // const renderedApi = renderApi(apiDescriptions[0], templates);

  //console.log(renderedApi);

  const renderedSamTemplate = renderSamTemplate(apiDescriptions, mockFunctionDescriptions, {}, templates);
  console.log('renderedSamTemplate\n', renderedSamTemplate);

  await fs.writeFile('template.yaml', renderedSamTemplate);
}

function renderSamTemplate(apis, functions, samTemplateOptions, templates) {
  const renderedApis = [];
  for(let api of apis) {
    const renderedApi = renderApi(api, templates);
    renderedApis.push(renderedApi);
  }

  const renderedFunctions = renderFunctions(functions, templates);

  const samTemplate = templates['sam-header'].template({...samTemplateOptions, renderedApis, renderedFunctions});
  return samTemplate;
}

function renderApi(apiDescription, templates) {
  const routes = renderRoutes(apiDescription.functions, templates);
  const apiDescriptionWithRoutes = { ...apiDescription, routes };

  return templates['websocket-api'].template(apiDescriptionWithRoutes);
}

function renderRoutes(functions, templates) {
  const routes = functions.map((f) => {
    const route = templates['websocket-route'].template(f);
    return route;
  });

  return routes.join('\r\n');
}

function renderFunctions(functions, templates) {
  const fns = functions.map((f) => {
    const fn = templates['function'].template(f);
    return fn;
  });

  return fns.join('\r\n');
}


doWork(mockApiDescriptions);

