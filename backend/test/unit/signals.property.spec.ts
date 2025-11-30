import fc from 'fast-check';
import { calculateRSI, calculateMACD } from '../../src/modules/signals/indicators';

describe('Signals property-based tests', () => {
  test('RSI stays within 0-100 across random inputs (100 runs)', () => {
    fc.assert(
      fc.property(fc.array(fc.float({ min: 0.01, max: 100000 }), { minLength: 15, maxLength: 60 }), (arr) => {
        const rsi = calculateRSI(arr, 14);
        return rsi === null || (rsi >= 0 && rsi <= 100);
      }),
      { numRuns: 100 },
    );
  });

  test('MACD returns aligned arrays for sufficient data', () => {
    fc.assert(
      fc.property(fc.array(fc.float({ min: 0.01, max: 100000 }), { minLength: 30, maxLength: 80 }), (arr) => {
        const macd = calculateMACD(arr, 12, 26, 9);
        return macd === null || (macd.macdLine.length === arr.length && macd.signalLine.length === arr.length && macd.histogram.length === arr.length);
      }),
      { numRuns: 100 },
    );
  });
});
