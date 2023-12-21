type Doctor = {
  name: string;
  specialty: string;
};

type Patient = {
  name: string;
  dob: string;
};

export type Appointment = {
  id?: string;
  created?: string;
  doctor: Doctor;
  patient: Patient;
  appointmentDateTime: string;
};
