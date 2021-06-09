import * as cdk from '@aws-cdk/core';
import {RemovalPolicy} from '@aws-cdk/core';
import * as S3 from '@aws-cdk/aws-s3';
import {BucketAccessControl, BucketEncryption} from '@aws-cdk/aws-s3';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import {BillingMode} from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as IAM from '@aws-cdk/aws-iam';
import {Effect} from '@aws-cdk/aws-iam';
import * as agw from '@aws-cdk/aws-apigateway';

import * as path from 'path';
import {S3EventSource} from '@aws-cdk/aws-lambda-event-sources';
import {LambdaIntegration} from "@aws-cdk/aws-apigateway";

export class CelebritiesRecognitionStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // S3 BUCKET
        const bucket = new S3.Bucket(this, 'ImagesBucket', {
            encryption: BucketEncryption.S3_MANAGED,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            bucketName: props?.stackName + 'bucket',
            accessControl: BucketAccessControl.PUBLIC_READ
        });

        // TABLE
        const table = new dynamodb.Table(this, 'RekognitionTable', {
            partitionKey: {name: 'id', type: dynamodb.AttributeType.STRING},
            billingMode: BillingMode.PAY_PER_REQUEST,
            tableName: props?.stackName + '-Table',
            removalPolicy: RemovalPolicy.DESTROY
        });

        // LAMBDAS
        const generatorFunction = new lambda.Function(this, 'LambdaGenerator', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'generator.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../functions')),
            environment: {
                'TABLE_NAME': table.tableName
            },
            functionName: props?.stackName + '-generator'
        });

        const endpointFunction = new lambda.Function(this, 'LambdaEndpoint', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'endpoint.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../functions')),
            environment: {
                'TABLE_NAME': table.tableName
            },
            functionName: props?.stackName + '-endpoint'
        });


        bucket.grantRead(generatorFunction);

        table.grantWriteData(generatorFunction);
        table.grantReadData(endpointFunction);

        generatorFunction.addToRolePolicy(new IAM.PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'rekognition:RecognizeCelebrities'
            ],
            resources: ['*']
        }));
        generatorFunction.addEventSource(new S3EventSource(bucket, {
            events: [S3.EventType.OBJECT_CREATED_PUT]
        }));

        const api = new agw.RestApi(this, 'metadata-api');

        const metadata = api.root.addResource('metadata');
        const metadataItem = metadata.addResource('{id}');
        metadataItem.addMethod('GET', new LambdaIntegration(endpointFunction));
    }
}
