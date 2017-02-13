import test from 'ava';
import * as utils from './utils';

test('convertVariables > transforms all variables in string', (t) => {
  t.is(utils.convertVariables(
    'http://example.com:{{var0}}/{{var1}}?foo={{var2}}'),
    'http://example.com:{$.ctx.var0}/{$.ctx.var1}?foo={$.ctx.var2}'
  );
});

test('convertVariables > handles undefined input', (t) => {
  t.is(utils.convertVariables(), undefined);
});

test('replaceVariables > replaces variables in string', (t) => {
  t.is(utils.replaceVariables(
    'http://example.com:{{var0}}/{{var1}}?foo={{var2}}'),
    'http://example.com:{$.ctx.var0}/{$.ctx.var1}?foo={$.ctx.var2}'
  );
});

test('replaceVariables > replaces variables in object fields', (t) => {
  t.deepEqual(
    utils.replaceVariables({
      foo: 'bar {{var0}}',
      baz: 'bar {{var1}}',
    }),
    {
      foo: 'bar {$.ctx.var0}',
      baz: 'bar {$.ctx.var1}',
    }
  );
});

test('replaceVariables > handles undefined input', (t) => {
  t.is(utils.replaceVariables(), undefined);
});

test('convertModeToHeader > returns content type object for formdata mode', (t) => {
  t.deepEqual(utils.convertModeToHeader('formdata'), {
    'Content-Type': 'application/x-www-form-urlencoded'
  });
});

test('convertModeToHeader > returns content type object for urlencoded mode', (t) => {
  t.deepEqual(utils.convertModeToHeader('urlencoded'), {
    'Content-Type': 'application/x-www-form-urlencoded'
  });
});

test('convertModeToHeader > returns content type object for params mode', (t) => {
  t.deepEqual(utils.convertModeToHeader('params'), {
    'Content-Type': 'multipart/form-data'
  });
});

test('convertModeToHeader > returns empty object for raw mode', (t) => {
  t.deepEqual(utils.convertModeToHeader('raw'), {});
});

test('convertModeToHeader > returns empty object for unsupported mode', (t) => {
  t.deepEqual(utils.convertModeToHeader('unsupported'), {});
});
