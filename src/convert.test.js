import test from 'ava';
import * as convert from './convert';

test('convert > createRequestHeaders > returns headers with body content type', (t) => {
  const headers = convert.createRequestHeaders({
    header: [{
      key: 'Authorization',
      value: 'Bearer TOKEN',
    }],
    body: {
      mode: 'formdata',
      formdata: []
    }
  });

  t.deepEqual(headers, {
    'Authorization': 'Bearer TOKEN',
    'Content-Type': 'application/x-www-form-urlencoded'
  });
});

test('convert > createRequestHeaders > returns body content type header', (t) => {
  const headers = convert.createRequestHeaders({
    body: {
      mode: 'urlencoded',
      urlencoded: []
    }
  });

  t.deepEqual(headers, {'Content-Type': 'application/x-www-form-urlencoded'});
});

test('convert > createRequestBody > returns raw body', (t) => {
  const body = convert.createRequestBody({
    body: {
      mode: 'raw',
      raw: 'test string'
    }
  });

  t.deepEqual(body, 'test string');
});

test('convert > createRequestBody > returns urlencoded body', (t) => {
  const body = convert.createRequestBody({
    body: {
      mode: 'urlencoded',
      urlencoded: [{
        key: 'foo',
        value: 'bar'
      }]
    }
  });

  t.deepEqual(body, {foo: 'bar'});
});

test('convert > createRequestBody > returns formdata body', (t) => {
  const body = convert.createRequestBody({
    body: {
      mode: 'formdata',
      formdata: [{
        key: 'foo',
        value: 'bar'
      }]
    }
  });

  t.deepEqual(body, {foo: 'bar'});
});

test('convert > createRequest > creates Flow request', (t) => {
  const request = convert.createRequest({
    url: 'http://example.com:{{var0}}/post',
    method: 'POST',
    header: [{
      key: 'Authorization',
      value: 'Bearer TOKEN',
    }],
    body: {
      mode: 'formdata',
      formdata: [{
        key: 'foo',
        value: 'bar'
      }]
    }
  });

  t.deepEqual(request, {
    method: 'post',
    url: 'http://example.com:<<!var0>>/post',
    headers: {
      Authorization: 'Bearer TOKEN',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: {
      foo: 'bar'
    }
  });
});

test('convert > createRequest > creates request with content type headers', (t) => {
  const request = convert.createRequest({
    url: 'http://example.com:{{var0}}/post',
    method: 'POST',
    body: {
      mode: 'formdata',
      formdata: [{
        key: 'foo',
        value: 'bar'
      }]
    }
  });

  t.deepEqual(request, {
    method: 'post',
    url: 'http://example.com:<<!var0>>/post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: {
      foo: 'bar'
    }
  });
});

test('convert > createRequest > creates request without body and headers', (t) => {
  const request = convert.createRequest({
    url: 'http://example.com:{{var0}}/post',
    method: 'POST'
  });

  t.deepEqual(request, {
    method: 'post',
    url: 'http://example.com:<<!var0>>/post'
  });
});

test('convert > createAuth > creates basic auth', (t) => {
  const auth = convert.createAuth({
    type: 'basic',
    basic: {
      username: 'user',
      password: 'password'
    }
  });

  t.deepEqual(auth, {
    type: 'basic',
    basic: {
      username: 'user',
      password: 'password'
    }
  });
});

test('convert > createAuth > creates oauth1 auth', (t) => {
  const auth = convert.createAuth({
    type: 'oauth1',
    oauth1: {
      consumerKey: 'consumer_key',
      consumerSecret: 'consumer_secret',
      token: 'token1111',
      tokenSecret: 'token_secret123',
      signatureMethod: 'HMAC-SHA256',
      timeStamp: '1448881347',
      nonce: 'lV4Xwg',
      version: '1.0',
      realm: '123123',
      addParamsToHeader: true,
      addEmptyParamsToSign: true
    }
  });

  t.deepEqual(auth, {
    type: 'oauth1',
    oauth1: {
      consumerKey: 'consumer_key',
      consumerSecret: 'consumer_secret',
      tokenSecret: 'token_secret123',
      signatureMethod: 'HMAC-SHA256',
      nonceLength: 'lV4Xwg',
      useHeader: true
    }
  });
});

test('convert > createAuth > creates basic auth', (t) => {
  const auth = convert.createAuth({
    type: 'basic',
    basic: {
      username: 'user',
      password: 'password'
    }
  });

  t.deepEqual(auth, {
    type: 'basic',
    basic: {
      username: 'user',
      password: 'password'
    }
  });
});

test('convert > createAuth > returns undefined for unsupported auth', (t) => {
  const auth = convert.createAuth({
    type: 'unsupported',
    unsupported: {
      username: 'user',
      password: 'password'
    }
  });

  t.is(auth, undefined);
});
