export class ProcessingError {
  constructor(message = "An error occurred", status = 400) {
    this.message = message;
    this.status = status;
  }
}
