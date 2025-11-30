import { BaseRepository, validatePositionInput, validatePositionUpdate } from './base.repository';
import { Position, PositionId, PositionInput, PositionUpdate, UserId } from './types';

let idCounter = 1;

function generateId(): PositionId {
  return `pos_${idCounter++}`;
}

export class PositionRepository extends BaseRepository<Position> {
  public create(userId: UserId, input: PositionInput): Position {
    validatePositionInput(input);

    const now = this.now();
    const position: Position = {
      id: generateId(),
      userId,
      symbol: input.symbol,
      amount: input.amount,
      entryPrice: input.entryPrice,
      entryDate: input.entryDate,
      createdAt: now,
      updatedAt: now,
    };

    this.getUserBucket(userId).set(position.id, position);
    return position;
  }

  public findAll(userId: UserId): Position[] {
    return Array.from(this.getUserBucket(userId).values());
  }

  public findById(userId: UserId, id: PositionId): Position | null {
    return this.getUserBucket(userId).get(id) || null;
  }

  public update(userId: UserId, id: PositionId, input: PositionUpdate): Position {
    validatePositionUpdate(input);
    const bucket = this.getUserBucket(userId);
    const existing = bucket.get(id);
    if (!existing) {
      throw new Error('Position not found');
    }

    const updated: Position = {
      ...existing,
      ...input,
      updatedAt: this.now(),
    };

    bucket.set(id, updated);
    return updated;
  }

  public delete(userId: UserId, id: PositionId): boolean {
    return this.getUserBucket(userId).delete(id);
  }
}
