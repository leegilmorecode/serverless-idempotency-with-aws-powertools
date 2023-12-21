#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { DoctorsServiceStatefulStack } from '../stateful/stateful';
import { DoctorsServiceStatelessStack } from '../stateless/stateless';

const app = new cdk.App();
const doctorsServiceStatefulStack = new DoctorsServiceStatefulStack(
  app,
  'DoctorsServiceStatefulStack',
  {}
);
new DoctorsServiceStatelessStack(app, 'DoctorsServiceStatelessStack', {
  table: doctorsServiceStatefulStack.table,
  idempotencyTable: doctorsServiceStatefulStack.idempotencyTable,
});
