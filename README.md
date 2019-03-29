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