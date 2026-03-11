import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function parseBigIntId(value: string, fieldName = 'id'): bigint {
  if (!/^\d+$/.test(value)) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }

  return BigInt(value);
}

export function serializePrisma<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_, currentValue) =>
      typeof currentValue === 'bigint' ? currentValue.toString() : currentValue,
    ),
  ) as T;
}

export function parseBigIntInput(
  value: string | number | bigint,
  fieldName: string,
): bigint {
  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return BigInt(value);
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return BigInt(value);
  }

  throw new BadRequestException(`${fieldName} must be a positive integer`);
}

export function parsePositiveInt(
  value: string | number,
  fieldName: string,
): number {
  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

export function parseNonNegativeInt(
  value: string | number,
  fieldName: string,
): number {
  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new BadRequestException(
      `${fieldName} must be a non-negative integer`,
    );
  }

  return parsed;
}

export function parseDecimalInput(
  value: string | number | Prisma.Decimal,
  fieldName: string,
): Prisma.Decimal {
  try {
    return new Prisma.Decimal(value);
  } catch {
    throw new BadRequestException(`${fieldName} must be a valid decimal value`);
  }
}
