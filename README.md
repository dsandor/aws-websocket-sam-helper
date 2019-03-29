# aws-websocket-sam-helper

This module will allow you to use json files to decorate your serverless code. Those json files will be used to generate out a valid SAM Template.

Place your `function.json` description file next to your code so it makes it simple to add a new function to your API Gateway and no more cutting and pasting large chunks of YAML in your sam template.

Here is an example of a Web Socket API Gateway route handler. 

```
{
  "functionName": "GetUserFunction",
  "routeKey": "get-user",
  "apiId": "ApiBuiltBySamHelper",
  "handler": "user/index.getHandler",
  "codeUri": "./",
  "policies": ["AmazonAPIGatewayInvokeFullAccess", "AmazonAPIGatewayAdministrator"]
}
```

That little description will generate out all of this YAML for you:

```yaml
  # Route
  #===========================
  #  Key: get-user route handler
  #  Handler: GetUserFunction
  #===========================
  GetUserFunctionRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref ApiBuiltBySamHelper
      RouteKey: get-user
      AuthorizationType: NONE
      OperationName: GetUserFunctionRoute
      Target: !Join
        - '/'
        - - 'integrations'
          - !Ref GetUserFunctionInteg

  GetUserFunctionInteg:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref ApiBuiltBySamHelper
      Description: GetUserFunction Integration
      IntegrationType: AWS_PROXY
      IntegrationUri:
        Fn::Sub:
          arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ GetUserFunction.Arn }/invocations

  GetUserFunctionPermission:
    Type: AWS::Lambda::Permission
    DependsOn:
      - ApiBuiltBySamHelper
      - GetUserFunction
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref GetUserFunction
      Principal: apigateway.amazonaws.com

  GetUserFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: user/index.getHandler
      Timeout: 30
      Runtime: nodejs8.10
      CodeUri: ./
      Policies:
        - AmazonAPIGatewayInvokeFullAccess
        - AmazonAPIGatewayAdministrator
```

You can also define the API Gateway API in your package.json file with this simple little addition:

```json
 "api": [
    {
      "apiId": "ApiBuiltBySamHelper",
      "apiName": "my-api-from-sam",
      "stageName": "v1",
      "stageDescription": "Version 1 of the api.",
      "routeSelectionExpression": "$request.body.action",
      "type": "websocket"
    }
  ]
```

---

The `function.json` and addition to the `package.json` file generates 82 lines of syntatcitcally correct SAM Template YaML.

### Watch the video below to see the helper in action.

[![asciicast](https://asciinema.org/a/3SLhDT8sxTWlTpjpnWbG1uDd7.svg)](https://asciinema.org/a/3SLhDT8sxTWlTpjpnWbG1uDd7)

---

## Installation

Install the helper into your serverless application.

```
yarn add aws-websocket-sam-helper
```

Optionally, you may want to add to your package.json a scripts entry that lets you run the helper.

```json
"scripts": {
    "generate-sam-template": "sam-helper"
}
```

This will allow you to regenerate your template.yaml file with the command:

```sh
yarn generate-sam-template
```

## Usage

You need to describe your API Gateway and your Functions. Everything else will be handled for you.

### Describe API Gateway

Add an `api` key to your `package.json` file to describe your API Gateway(s).

```json
"api": [
    {
      "apiId": "ApiBuiltBySamHelper",
      "apiName": "my-api-from-sam",
      "stageName": "v1",
      "stageDescription": "Version 1 of the api.",
      "routeSelectionExpression": "$request.body.action",
      "type": "websocket"
    }
  ]
```

| property | description |
|---|---|
| apiId | This is the identifier for this API Gateway. When describing a Function you will refer to this ID. This ID is only used when creating relationships in your template.yaml file. |
| apiName | This name will display in your AWS API Gateway Console. You must name the API so that it meeds the api name constraints. |
| stageName | When deploying, what is the name of the stage. This is the start of your API Gateway URL. |
| stageDescription | Describe the stage. |
|routeSelectionExpression | [See the API Gateway documentation for this.](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-selection-expressions.html#apigateway-websocket-api-route-selection-expressions) This expression describes where in the WebSocket message to look for a value which will contain your route key.|
| type | websocket or rest, currently only websocket is supported at this time. |

### Describe a Function

Anywhere in your project folder structure you can define `function.json` files (or `*.function.json`). The contents of this file describe your Lambda function and relate it to an API Gateway Route or Endpoint.

```json
{
  "functionName": "GetUserFunction",
  "routeKey": "get-user",
  "apiId": "ApiBuiltBySamHelper",
  "handler": "user/index.getHandler",
  "codeUri": "./",
  "policies": ["AmazonAPIGatewayInvokeFullAccess", "AmazonAPIGatewayAdministrator"]
}
```

For example, if you have a sub folder in your project named `user` and you have an `index.js` file that defines your Lambda with an export named `getHandler` the above json file will hook it up to your API Gateway named `ApiBuildBySamHelper`.

| property | description | default | required |
|---|---|---|---|
|functionName|A YAML compatible function name. This is used in the SAM Template to refer to your function. It is suggested to use a Proper or Camel case syntax of just upper and lower case letters.||yes|
|routeKey| For a web socket route handler this is the key that will route a message to this lambda.||yes (for websocket)|
|apiId|The api id you configured in your package.json to identify the api gateway. This connects this function to the APIGW||yes|
|handler|This is the location of the exported lambda function. Note the format is {relative_file_path}/{javascript_file_name}.{exported_function_name}|index.handler|no|
|codeUri|Defined the root of the deployed lambda code.|./|no|
|policies|Any AWS Policies you want defined on your lambda.||no|
|timeout|Max time in seconds that your Lambda can stay alive.|30|no|
|runtime|Any valid Lambda Runtime value.|nodejs8.10|no|
|environmentVariables|An object representing key value pairs of Environment Variables you wish to add to the Lambda. ex: { name: 'NODE_ENV', value: 'dev' }||no|



  