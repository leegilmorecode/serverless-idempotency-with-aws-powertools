import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { Construct } from 'constructs';

interface IdempotencyTableProps
  extends Pick<dynamodb.TableProps, 'removalPolicy' | 'tableName'> {
  /**
   * The table name
   */
  tableName: string;
  /**
   * The removal policy for the table
   */
  removalPolicy: cdk.RemovalPolicy;
}

type FixedDynamoDbTableProps = Omit<dynamodb.TableProps, 'removalPolicy'>;

export class IdempotencyTable extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: IdempotencyTableProps) {
    super(scope, id);

    const fixedProps: FixedDynamoDbTableProps = {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      tableName: props.tableName,
      pointInTimeRecovery: false,
      contributorInsightsEnabled: true,
      partitionKey: {
        name: 'id', // this must be set for the powertools package to work
        type: dynamodb.AttributeType.STRING,
      },
      timeToLiveAttribute: 'expiration', // this must be set for the powertools package to work
    };

    this.table = new dynamodb.Table(this, id + 'IdempTable', {
      // fixed props
      ...fixedProps,
      // custom props
      ...props,
    });
  }
}
