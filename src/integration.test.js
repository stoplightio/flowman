import test from 'ava';
import {convert} from './convert';
import cases from './integration.test-cases';

for (const c of cases) {
  test(`${c.name}`, (t) => {
    const result = convert(c.collection);
    t.deepEqual(c.scenarios, result);
  });
}
