export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'Unique identifier for the appointment',
    },
    created: {
      type: 'string',
      description: 'Timestamp indicating when the appointment was created',
    },
    doctor: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: "Doctor's name",
        },
        specialty: {
          type: 'string',
          description: "Doctor's specialty",
        },
      },
      required: ['name', 'specialty'],
    },
    patient: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: "Patient's name",
        },
        dob: {
          type: 'string',
          format: 'date',
          description: "Patient's date of birth",
        },
      },
      required: ['name', 'dob'],
    },
    appointmentDateTime: {
      type: 'string',
      description: 'Date and time of the appointment',
    },
  },
  required: ['id', 'created', 'doctor', 'patient', 'appointmentDateTime'],
};
