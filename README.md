# Welcome to your CDK TypeScript project!

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template


npm i -g aws-cdk
npm install -g typescript
cdk init app --language typescript

npm i

cdk bootstrap aws://ACCOUNT/REGION
cdk deploy
cdk destroy

remove bootstrap from console when not needed
