import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

import { marshall } from '@aws-sdk/util-dynamodb';
import { config } from '@config';
import { Appointment } from '@dto/appointment';
import { logger } from '@shared';

const dynamoDb = new DynamoDBClient({});

export async function bookAppointment(
  appointment: Appointment
): Promise<Appointment> {
  const tableName = config.get('tableName');

  const params = {
    TableName: tableName,
    Item: marshall(appointment),
  };

  try {
    await dynamoDb.send(new PutItemCommand(params));

    logger.info(`appointment created with ${appointment.id} into ${tableName}`);

    return appointment;
  } catch (error) {
    console.error('error creating appointment:', error);
    throw error;
  }
}
