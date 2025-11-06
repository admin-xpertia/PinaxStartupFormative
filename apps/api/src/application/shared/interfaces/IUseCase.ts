import { Result } from '../types/Result';

/**
 * Base interface for all Use Cases
 * Use Cases orchestrate the flow of data to and from entities
 * They contain application-specific business rules
 */
export interface IUseCase<TRequest, TResponse, TError = Error> {
  /**
   * Executes the use case with the given request
   * Returns a Result that can be either successful or failed
   */
  execute(request: TRequest): Promise<Result<TResponse, TError>>;
}

/**
 * Base interface for Query Use Cases (read-only operations)
 */
export interface IQuery<TRequest, TResponse, TError = Error> {
  /**
   * Executes the query with the given request
   * Returns a Result that can be either successful or failed
   */
  execute(request: TRequest): Promise<Result<TResponse, TError>>;
}

/**
 * Base interface for Command Use Cases (write operations)
 */
export interface ICommand<TRequest, TResponse, TError = Error> {
  /**
   * Executes the command with the given request
   * Returns a Result that can be either successful or failed
   */
  execute(request: TRequest): Promise<Result<TResponse, TError>>;
}
