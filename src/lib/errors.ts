/** An error whose message is meant for the person using the app (German, no internal details). */
export class PublicError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}
