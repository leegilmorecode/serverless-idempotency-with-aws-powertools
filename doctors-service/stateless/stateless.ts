import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

import { Tracing } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface DoctorsServiceStatelessStackProps extends cdk.StackProps {
  table: dynamodb.Table;
  idempotencyTable: dynamodb.Table;
}

export class DoctorsServiceStatelessStack extends cdk.Stack {
  // the following props are passed from our stateful stack
  public readonly idempotencyTable: dynamodb.Table;
  public readonly table: dynamodb.Table;

  constructor(
    scope: Construct,
    id: string,
    props: DoctorsServiceStatelessStackProps
  ) {
    super(scope, id, props);

    this.table = props.table;
    this.idempotencyTable = props.idempotencyTable;

    // add our powertools config
    const lambdaPowerToolsConfig = {
      LOG_LEVEL: 'DEBUG',
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
      POWERTOOLS_TRACE_ENABLED: 'enabled',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'captureHTTPsRequests',
      POWERTOOLS_SERVICE_NAME: 'DoctorsService',
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'captureResult',
      POWERTOOLS_METRICS_NAMESPACE: 'DoctorsNamespace',
      IDEMPOTENCY_TABLE_NAME: this.idempotencyTable.tableName, // this is important for idempotency to work
    };

    // create the lambda for booking an appointment
    const bookAppointmentLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'BookAppointment', {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          'src/adapters/primary/book-appointment/book-appointment.adapter.ts'
        ),
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        tracing: Tracing.ACTIVE,
        handler: 'handler',
        bundling: {
          minify: true,
          externalModules: [],
        },
        environment: {
          TABLE_NAME: this.table.tableName,
          ...lambdaPowerToolsConfig,
        },
      });

    // give the lambda access to the dynamodb table
    this.table.grantWriteData(bookAppointmentLambda);

    // give the lambda access to the idempotency table
    this.idempotencyTable.grantReadWriteData(bookAppointmentLambda);

    // create the api gateway for appointments
    const api: apigw.RestApi = new apigw.RestApi(this, 'DoctorsApi', {
      description: 'Doctors API',
      endpointTypes: [apigw.EndpointType.REGIONAL],
      deploy: true,
      deployOptions: {
        stageName: 'prod',
        dataTraceEnabled: true,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        tracingEnabled: true,
        metricsEnabled: true,
      },
    });
    api.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // create the appointment resource and add a post endpoint for our function
    const appointments: apigw.Resource = api.root.addResource('appointments');
    appointments.addMethod(
      'POST',
      new apigw.LambdaIntegration(bookAppointmentLambda, {
        proxy: true,
      })
    );
  }
}
