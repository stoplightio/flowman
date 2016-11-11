import test from 'ava';
import * as utils from './utils';

test('utils > convertVariables > transforms all variables in string', (t) => {
  t.is(utils.convertVariables(
    'http://example.com:{{var0}}/{{var1}}?foo={{var2}}'),
    'http://example.com:<<!var0>>/<<!var1>>?foo=<<!var2>>'
  );
});

test('utils > convertModeToHeader > returns content type object for formdata mode', (t) => {
  t.deepEqual(utils.convertModeToHeader('formdata'), {
    'Content-Type': 'application/x-www-form-urlencoded'
  });
});

test('utils > convertModeToHeader > returns content type object for urlencoded mode', (t) => {
  t.deepEqual(utils.convertModeToHeader('urlencoded'), {
    'Content-Type': 'application/x-www-form-urlencoded'
  });
});

test('utils > convertModeToHeader > returns content type object for params mode', (t) => {
  t.deepEqual(utils.convertModeToHeader('params'), {
    'Content-Type': 'multipart/form-data'
  });
});

test('utils > convertModeToHeader > returns empty object for raw mode', (t) => {
  t.deepEqual(utils.convertModeToHeader('raw'), {});
});

test('utils > convertModeToHeader > returns empty object for unsupported mode', (t) => {
  t.deepEqual(utils.convertModeToHeader('unsupported'), {});
});