// types.js

export const PERSON_KEYS = ['person1', 'person2'];

export /**
 * MonthlySleepData
 * {
 *   '2024-01-01': {
 *     person1: { cycles, stats },
 *     person2: { cycles, stats }
 *   }
 * }
 */
const isValidPerson = (p) => PERSON_KEYS.includes(p);

// ChartTheme example
export const defaultTheme = {
    bgColor: '#090040',
  
    sleepGradient: {
      min: [255, 80, 80],
      max: [80, 120, 255],
      maxHours: 7,
    },
    emptyRing: [255, 255, 255, 30], // ← データなし日用
    emptyBar: [255, 255, 255, 30],
  };
  