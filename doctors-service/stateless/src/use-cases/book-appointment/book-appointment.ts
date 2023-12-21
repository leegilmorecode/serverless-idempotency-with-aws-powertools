import { getISOString, logger, schemaValidator } from '@shared';

import { bookAppointment } from '@adapters/secondary/database-adapter';
import { Appointment } from '@dto/appointment';
import { schema } from '@schemas/appointment';
import { v4 as uuid } from 'uuid';

export async function bookAppointmentUseCase(
  appointment: Appointment
): Promise<Appointment> {
  const createdDate = getISOString();

  const createdAppointment: Appointment = {
    id: uuid(),
    created: createdDate,
    ...appointment,
  };

  logger.info(`appointment use case: ${JSON.stringify(createdAppointment)}`);

  schemaValidator(schema, createdAppointment);

  // add your super duper business logic here

  await bookAppointment(createdAppointment);

  logger.info(`appointment created for id ${createdAppointment.id}`);

  return createdAppointment;
}
