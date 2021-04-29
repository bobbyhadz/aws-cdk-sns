import * as lambda from '@aws-cdk/aws-lambda';
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
import * as sns from '@aws-cdk/aws-sns';
import * as subs from '@aws-cdk/aws-sns-subscriptions';
import * as sqs from '@aws-cdk/aws-sqs';
import * as cdk from '@aws-cdk/core';
import * as path from 'path';

export class CdkStarterStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 create sns topic
    const topic = new sns.Topic(this, 'sns-topic', {
      displayName: 'My SNS topic',
    });

    // 👇 create lambda function
    const myLambda = new NodejsFunction(this, 'my-lambda', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, `/../src/my-lambda/index.ts`),
    });

    // 👇 subscribe Lambda to SNS topic
    topic.addSubscription(new subs.LambdaSubscription(myLambda));

    // 👇 create queue
    const queue = new sqs.Queue(this, 'sqs-queue');

    // 👇 subscribe queue to topic
    topic.addSubscription(new subs.SqsSubscription(queue));

    // 👇 create Dead letter Queue Lambda
    const dlqLambda = new NodejsFunction(this, 'dlq-lambda', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, `/../src/dlq-lambda/index.ts`),
    });

    // 👇 subscribe DLQ Lambda to sns topic
    topic.addSubscription(new subs.LambdaSubscription(dlqLambda));

    // 👇 create Dead letter Queue
    const deadLetterQueue = new sqs.Queue(this, 'dead-letter-queue', {
      retentionPeriod: cdk.Duration.minutes(30),
    });

    // 👇 set up the Dead letter Queue for the SNS topic
    new sns.Subscription(this, 'sns-subscription', {
      endpoint: dlqLambda.functionArn,
      protocol: sns.SubscriptionProtocol.LAMBDA,
      topic,
      deadLetterQueue,
    });

    new cdk.CfnOutput(this, 'snsTopicArn', {
      value: topic.topicArn,
      description: 'The arn of the SNS topic',
    });
  }
}
