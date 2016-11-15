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

test('convert > getURL > returns URL parsed from string', (t) => {
  const url = convert.getURL('http://example.com:{{var0}}/post');

  t.is(url, 'http://example.com:<<!var0>>/post');
});

test('convert > getURL > returns URL parsed from object', (t) => {
  const url = convert.getURL({
    raw: 'http://example.com:{{var0}}/post',
  });

  t.is(url, 'http://example.com:<<!var0>>/post');
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

test('convert > createInput > creates input', (t) => {
  const input = convert.createInput({
    request: {
      url: 'http://example.com:{{var0}}/post',
      method: 'POST',
      auth: {
        type: 'basic',
        basic: {
          username: 'user',
          password: 'password'
        }
      }
    }
  });

  t.deepEqual(input, {
    request: {
      method: 'post',
      url: 'http://example.com:<<!var0>>/post'
    },
    authorization: {
      type: 'basic',
      basic: {
        username: 'user',
        password: 'password'
      }
    }
  });
});

test('convert > createInput > handles undefined input', (t) => {
  t.is(convert.createInput({}), null);
});

test('convert > createScript > creates before script from array exec', (t) => {
  const script = convert.createScript({
    event: [
      {
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: ['postman.clearGlobalVariable("variable_key");']
        }
      }
    ]
  }, 'prerequest');

  t.deepEqual(script, {
    script: 'postman.clearGlobalVariable("variable_key");'
  });
});

test('convert > createScript > creates after script from string exec', (t) => {
  const script = convert.createScript({
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: 'tests["Body contains headers"] = responseBody.has("headers");'
        }
      }
    ]
  }, 'test');

  t.deepEqual(script, {
    script: 'tests["Body contains headers"] = responseBody.has("headers");'
  });
});

test('convert > createScript > handles undefined input', (t) => {
  const script = convert.createScript({event: []}, 'test');

  t.is(script, undefined);
});

test('convert > createFunction > creates function', (t) => {
  const fn = convert.createFunction({
    name: 'Test Item',
    request: {
      url: 'http://example.com:{{var0}}/post',
      method: 'POST',
      auth: {
        type: 'basic',
        basic: {
          username: 'user',
          password: 'password'
        }
      }
    },
    event: [
      {
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: ['postman.clearGlobalVariable("variable_key");']
        }
      },
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: 'tests["Body contains headers"] = responseBody.has("headers");'
        }
      }
    ]
  });

  t.deepEqual(fn, {
      name: 'Test Item',
      input: {
        request: {
          method: 'post',
          url: 'http://example.com:<<!var0>>/post'
        },
        authorization: {
          type: 'basic',
          basic: {
            username: 'user',
            password: 'password'
          }
        }
      },
      before: {
        script: 'postman.clearGlobalVariable("variable_key");'
      },
      after: {
        script: 'tests["Body contains headers"] = responseBody.has("headers");'
      }
    }
  );
});

test('convert > createStep > creates step with one function', (t) => {
  const step = convert.createStep({
    name: 'Test Item',
    request: {
      url: 'http://example.com:{{var0}}/post',
      method: 'POST',
      auth: {
        type: 'basic',
        basic: {
          username: 'user',
          password: 'password'
        }
      }
    },
    event: [
      {
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: ['postman.clearGlobalVariable("variable_key");']
        }
      },
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: 'tests["Body contains headers"] = responseBody.has("headers");'
        }
      }
    ]
  });

  t.deepEqual(step, {
    functions: [{
      name: 'Test Item',
      input: {
        request: {
          method: 'post',
          url: 'http://example.com:<<!var0>>/post'
        },
        authorization: {
          type: 'basic',
          basic: {
            username: 'user',
            password: 'password'
          }
        }
      },
      before: {
        script: 'postman.clearGlobalVariable("variable_key");'
      },
      after: {
        script: 'tests["Body contains headers"] = responseBody.has("headers");'
      }
    }]
  });
});

test('convert > createStep > handles undefined input', (t) => {
  t.deepEqual(convert.createStep(), {
    functions: [{
      input: null
    }]
  });
});

test('convert > createFlow > creates flow with one step', (t) => {
  const flow = convert.createFlow({
    name: 'Test Item',
    request: {
      url: 'http://example.com:{{var0}}/post',
      method: 'POST',
      auth: {
        type: 'basic',
        basic: {
          username: 'user',
          password: 'password'
        }
      }
    }
  });

  t.deepEqual(flow, {
    name: 'Test Item',
    flowVersion: '1.0',
    resourceId: 'test-item',
    steps: [{
      functions: [{
        name: 'Test Item',
        input: {
          request: {
            method: 'post',
            url: 'http://example.com:<<!var0>>/post'
          },
          authorization: {
            type: 'basic',
            basic: {
              username: 'user',
              password: 'password'
            }
          }
        }
      }]
    }]
  });
});

test('convert > createFlow > creates flow with multiple steps', (t) => {
  const flow = convert.createFlow({
    name: 'Test Item',
    item: [
      {
        name: 'Test Subitem 1',
        request: {
          url: 'http://example.com:{{var0}}',
          method: 'GET'
        }
      },
      {
        name: 'Test Subitem 2',
        request: {
          url: 'http://example.com:{{var0}}/post',
          method: 'POST'
        }
      }
    ]
  });

  t.deepEqual(flow, {
      name: 'Test Item',
      flowVersion: '1.0',
      resourceId: 'test-item',
      steps: [
        {
          functions: [{
            name: 'Test Subitem 1',
            input: {
              request: {
                method: 'get',
                url: 'http://example.com:<<!var0>>'
              }
            }
          }]
        },
        {
          functions: [{
            name: 'Test Subitem 2',
            input: {
              request: {
                method: 'post',
                url: 'http://example.com:<<!var0>>/post'
              }
            }
          }]
        }
      ]
    }
  );
});

test('convert > convert > creates flow collection', (t) => {
  const collection = convert.convert({
    info: {
      name: 'Test collection',
    },
    item: []
  });

  t.deepEqual(collection, {name: 'Test collection', flows: []});
});

test('convert > convert > handles undefined input', (t) => {
  t.deepEqual(convert.convert(), []);
});
