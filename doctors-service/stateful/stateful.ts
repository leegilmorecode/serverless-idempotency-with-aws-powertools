import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { Construct } from 'constructs';
import { IdempotencyTable } from '../custom-constructs';
import { config } from '../stateless/src/config';

export class DoctorsServiceStatefulStack extends cdk.Stack {
  public readonly idempotencyTable: dynamodb.Table;
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create the idempotency table for our api using our custom construct
    // which is reusable for other projects and use cases
    this.idempotencyTable = new IdempotencyTable(this, 'Idempotency', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: config.get('idempotencytTableName'),
    }).table;

    // crteate the table which will store our appointments
    this.table = new dynamodb.Table(this, 'DoctorsServiceTable', {
      tableName: 'appointments',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });
    this.table.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
  }
}
