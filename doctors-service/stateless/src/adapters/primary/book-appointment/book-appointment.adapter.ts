import {
  MetricUnits,
  Metrics,
  logMetrics,
} from '@aws-lambda-powertools/metrics';
import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import { errorHandler, logger, schemaValidator } from '@shared';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

import { IdempotencyConfig } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { config } from '@config';
import { Appointment } from '@dto/appointment';
import { ValidationError } from '@errors/validation-error';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import { bookAppointmentUseCase } from '@use-cases/book-appointment';
import { schema } from './book-appointment.schema';

const tracer = new Tracer({});
const metrics = new Metrics({});

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: config.get('idempotencytTableName'),
});

const idempotencyConfig = new IdempotencyConfig({
  expiresAfterSeconds: 10, // how long to store the idempotency record
  eventKeyJmesPath: 'body', // what the idempotency cache is based on
  useLocalCache: false,
  maxLocalCacheSize: 512,
});

export const bookAppointmentAdapter = async (
  { body }: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  idempotencyConfig.registerLambdaContext(context);
  try {
    if (!body) throw new ValidationError('no payload body');

    const appointment = JSON.parse(body) as Appointment;

    schemaValidator(schema, appointment);

    const created: Appointment = await bookAppointmentUseCase(appointment);

    metrics.addMetric('SuccessfulBookAppointment', MetricUnits.Count, 1);

    return {
      statusCode: 201,
      body: JSON.stringify(created),
    };
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;

    metrics.addMetric('BookAppointmentCreatedError', MetricUnits.Count, 1);

    return errorHandler(error);
  }
};

export const handler = middy()
  .handler(bookAppointmentAdapter)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics))
  .use(
    makeHandlerIdempotent({
      persistenceStore,
      config: idempotencyConfig,
    })
  )
  .use(httpErrorHandler());
