/** Error raised by the data layer. Pages show a friendly state; details go to the server log. */
export type DataErrorCode = 'unconfigured' | 'query';

export class DataError extends Error {
  readonly code: DataErrorCode;

  constructor(message: string, code: DataErrorCode) {
    super(message);
    this.name = 'DataError';
    this.code = code;
  }
}
