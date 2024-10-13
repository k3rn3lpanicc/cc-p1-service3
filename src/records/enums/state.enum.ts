/* eslint-disable prettier/prettier */
export const STATE = {
  CREATED: 'CREATED', // image uploaded, message in rmq sent
  PENDING: 'PENDING', // message in rmq received, processing
  READY: 'READY', // caption generated
  FAILED: 'FAILED', // something went wrong
  DONE: 'DONE', // new image generated
  SENT: 'SENT', // email sent
};
