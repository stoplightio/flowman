import test from 'ava';
import {convert} from './convert';
import cases from './convert.test-cases';

for (const c of cases) {
  test(`convert > ${c.name}`, (t) => {
    const result = convert(c.collection);
    t.deepEqual(c.flow, result);
  });
}
