const fs = require('fs-extra');
const Handlebars = require('handlebars');
const path = require('path');

Handlebars.registerHelper('functionNameList', (items) => {
  return items.map((i) => `      - ${i.functionName}`).join('\r\n')
});

Handlebars.registerHelper('routeList', (functions) => {
  return functions.map((i) => `      - ${i.functionName}`).join('\r\n')
});

Handlebars.registerHelper('safeVal', function (value, safeValue) {
  const out = value || safeValue;
  return new Handlebars.SafeString(out);
});

const DEFAULT_FUNCTION_DEF_FILENAME = 'function.json';

class SamHelper {
  constructor(apiDefinitions, functionDefinitions) {
    this.apiDefinitions = apiDefinitions;
    this.functionDefinitions = functionDefinitions;
  }

  async loadTemplates(realtivePathToTemplates = 'templates') {
    const templatePath = path.join(__dirname, realtivePathToTemplates);
    const files = await fs.readdir(templatePath);
    this.templates = await files.reduce(async (prev, curr) => {
      const templateFilePath = path.join(templatePath, curr);
      const source = await fs.readFile(templateFilePath, { encoding: 'utf8' });
      const template = Handlebars.compile(source);

      const prevValue = await prev;
      prevValue[path.basename(curr.toLowerCase(), '.yaml')] = { templateFilePath, source, template };
      return prevValue;
    }, {});

    return this.templates;
  }

  static async loadFunctionDefinitions(startingPath = __dirname) {
    if (startingPath.indexOf('node_modules') >= 0) return;

    const dirItems = await fs.readdir(startingPath, { withFileTypes: true });
    const dirs = [];
    const files = [];

    for(let dir of dirItems) {
      const dirPath = path.join(startingPath, dir);
      const stat = await fs.lstat(dirPath);
      if (stat.isDirectory()) {
        dirs.push(dirPath)
      } else {
        files.push(dirPath);
      }
    }

    const functionDefinitions = [];

    for(const dir of dirs) {
      const funcDefs = await SamHelper.loadFunctionDefinitions(dir) || [];
      for(const funcDef of funcDefs) {
        functionDefinitions.push(funcDef);
      }
    }

    for(const file of files) {
      if (file.endsWith(DEFAULT_FUNCTION_DEF_FILENAME)) {
        let functionDefinition = await fs.readJson(file);

        functionDefinition.functionDefinitionFilePath = file;

        functionDefinitions.push(functionDefinition);
      }
    }

    return functionDefinitions;
  }

  /**
   * Loads the api definitions. Can load from package.json under the "api" key or from a stand alone file.
   * @param options - { usePackageJson: *true|false, apiDefinitionFile: 'path_to_json_file' }
   * @returns {Promise<void>}
   * @description - The apiDefinitionFile is of the format: [{ apiDef }, { apiDef }, ...]
   */
  static async loadApiDefinitions(options = { usePackageJson: true, apiDefinitionFile: '' }) {
    if (options.usePackageJson) {
      const pkg = await fs.readJson('package.json');
      if (pkg) {
        return pkg.api;
      }
    }

    const apiDefs = await fs.readJson(options.apiDefinitionFile);
    return apiDefs;
  }

  /**
   * Renders a complete SAM Template with all the API's, Routes, Functions based on the apis and functions.
   * @param apis - Array of api definitions.
   * @param functions - Array of function definitions.
   * @returns {Promise<void>} - Writes a file.
   */
  async render(apis = this.apiDefinitions, functions = this.functionDefinitions) {
    const templates = await this.loadTemplates();

    const apiDescriptions = [];
    for(let apiDescription of apis) {
      // find each api, add related functions to api description.
      apiDescription.functions = functions.filter((f) => f.apiId === apiDescription.apiId);
      apiDescriptions.push(apiDescription);
    }

    const renderedSamTemplate = this.renderSamTemplate(apiDescriptions, functions, templates);

    await fs.writeFile('template.yaml', renderedSamTemplate);

    return renderedSamTemplate;
  }

  renderSamTemplate(apis = this.apiDefinitions, functions = this.functionDefinitions, templates) {
    const renderedApis = [];
    for(let api of apis) {
      const renderedApi = this.renderApi(api, templates);
      renderedApis.push(renderedApi);
    }

    const renderedFunctions = this.renderFunctions(functions, templates);

    const samTemplate = templates['sam-header'].template({renderedApis, renderedFunctions});
    return samTemplate;
  }

  renderApi(apiDescription, templates) {
    const routes = this.renderRoutes(apiDescription.functions, templates);
    const apiDescriptionWithRoutes = { ...apiDescription, routes };

    return templates['websocket-api'].template(apiDescriptionWithRoutes);
  }

  renderRoutes(functions, templates) {
    const routes = functions.map((f) => {
      const route = templates['websocket-route'].template(f);
      return route;
    });

    return routes.join('\r\n');
  }

  renderFunctions(functions, templates) {
    const fns = functions.map((f) => {
      const fn = templates['function'].template(f);
      return fn;
    });

    return fns.join('\r\n');
  }

}

module.exports = SamHelper;