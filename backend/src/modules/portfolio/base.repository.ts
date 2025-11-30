import { Position, PositionId, PositionInput, PositionUpdate, UserId } from './types';

/**
 * Lightweight in-memory repository base to mimic database behavior.
 * Provides user-scoped storage and common helpers for derived repositories.
 */
export abstract class BaseRepository<T extends { id: PositionId; userId: UserId }> {
  protected store: Map<UserId, Map<PositionId, T>> = new Map();

  public clear(): void {
    this.store.clear();
  }

  protected now(): Date {
    return new Date();
  }

  protected getUserBucket(userId: UserId): Map<PositionId, T> {
    if (!this.store.has(userId)) {
      this.store.set(userId, new Map());
    }
    return this.store.get(userId)!;
  }
}

// Simple validation helpers shared by repositories and controllers.
export function validatePositionInput(input: PositionInput): void {
  if (!input.symbol || typeof input.symbol !== 'string') {
    throw new Error('symbol is required');
  }
  if (input.amount <= 0 || !Number.isFinite(input.amount)) {
    throw new Error('amount must be positive');
  }
  if (input.entryPrice <= 0 || !Number.isFinite(input.entryPrice)) {
    throw new Error('entryPrice must be positive');
  }
  if (!input.entryDate) {
    throw new Error('entryDate is required');
  }

  const entryTime = Date.parse(input.entryDate);
  if (Number.isNaN(entryTime)) {
    throw new Error('entryDate must be a valid date');
  }
  if (entryTime > Date.now()) {
    throw new Error('entryDate cannot be in the future');
  }
}

export function validatePositionUpdate(input: PositionUpdate): void {
  if (input.symbol !== undefined && !input.symbol) {
    throw new Error('symbol must be non-empty');
  }
  if (input.amount !== undefined && (input.amount <= 0 || !Number.isFinite(input.amount))) {
    throw new Error('amount must be positive');
  }
  if (input.entryPrice !== undefined && (input.entryPrice <= 0 || !Number.isFinite(input.entryPrice))) {
    throw new Error('entryPrice must be positive');
  }
  if (input.entryDate !== undefined && !input.entryDate) {
    throw new Error('entryDate must be non-empty');
  }

  if (input.entryDate !== undefined) {
    const entryTime = Date.parse(input.entryDate);
    if (Number.isNaN(entryTime)) {
      throw new Error('entryDate must be a valid date');
    }
    if (entryTime > Date.now()) {
      throw new Error('entryDate cannot be in the future');
    }
  }
}
