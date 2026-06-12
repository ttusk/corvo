/**
 * Base domain error class
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

/**
 * Error thrown when an entity is not found
 */
export class NotFoundError extends Error {
  constructor(entityType: string, id: string) {
    super(`${entityType} "${id}" was not found.`);
    this.name = "NotFoundError";
  }
}

/**
 * Error thrown when an entity already exists
 */
export class AlreadyExistsError extends Error {
  constructor(entityType: string, id: string) {
    super(`${entityType} "${id}" already exists.`);
    this.name = "AlreadyExistsError";
  }
}

/**
 * Error thrown when there is no active contest
 */
export class NoActiveContestError extends Error {
  constructor() {
    super("There is no active contest.");
    this.name = "NoActiveContestError";
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
