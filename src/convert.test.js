import test from 'ava';
import * as convert from './convert';
import _ from 'lodash';

const deleteIds = (obj) => {
  const newObj = _.clone(obj);

  for (const field in newObj) {
    if (newObj.hasOwnProperty(field)) {
      if (field === 'id') {
        delete newObj[field];
      }

      if (_.isArray(newObj[field])) {
        newObj[field] = newObj[field].map(deleteIds);
      }
    }
  }

  return newObj;
};

test('createRequestHeaders > returns headers with body content type', (t) => {
  const headers = convert.createRequestHeaders({
    header: [{
      key: 'Authorization',
      value: 'Bearer {{TOKEN}}',
    }],
    body: {
      mode: 'formdata',
      formdata: []
    }
  });

  t.deepEqual(headers, {
    'Authorization': 'Bearer {$.ctx.TOKEN}',
    'Content-Type': 'application/x-www-form-urlencoded'
  });
});

test('createRequestHeaders > returns body content type header', (t) => {
  const headers = convert.createRequestHeaders({
    body: {
      mode: 'urlencoded',
      urlencoded: []
    }
  });

  t.deepEqual(headers, {'Content-Type': 'application/x-www-form-urlencoded'});
});

test('createRequestBody > returns raw body with replaced variables', (t) => {
  const body = convert.createRequestBody({
    body: {
      mode: 'raw',
      raw: 'test string {{var0}}'
    }
  });

  t.deepEqual(body, 'test string {$.ctx.var0}');
});

test('createRequestBody > returns urlencoded body with replaced variables', (t) => {
  const body = convert.createRequestBody({
    body: {
      mode: 'urlencoded',
      urlencoded: [{
        key: 'foo',
        value: 'bar {{var0}}'
      }]
    }
  });

  t.deepEqual(body, {foo: 'bar {$.ctx.var0}'});
});

test('createRequestBody > returns formdata body with replaced variables', (t) => {
  const body = convert.createRequestBody({
    body: {
      mode: 'formdata',
      formdata: [{
        key: 'foo',
        value: 'bar {{var0}}'
      }]
    }
  });

  t.deepEqual(body, {foo: 'bar {$.ctx.var0}'});
});

test('getURL > returns URL parsed from string', (t) => {
  const url = convert.getURL('http://example.com:{{var0}}/post');

  t.is(url, 'http://example.com:{$.ctx.var0}/post');
});

test('getURL > returns URL parsed from object', (t) => {
  const url = convert.getURL({
    raw: 'http://example.com:{{var0}}/post',
  });

  t.is(url, 'http://example.com:{$.ctx.var0}/post');
});

test('createInput > creates input', (t) => {
  const request = convert.createInput({
    request: {
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
    }
  });

  t.deepEqual(request, {
    method: 'post',
    url: 'http://example.com:{$.ctx.var0}/post',
    headers: {
      Authorization: 'Bearer TOKEN',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: {
      foo: 'bar'
    }
  });
});

test('createInput > creates input with content type headers', (t) => {
  const request = convert.createInput({
    request: {
      url: 'http://example.com:{{var0}}/post',
      method: 'POST',
      body: {
        mode: 'formdata',
        formdata: [{
          key: 'foo',
          value: 'bar'
        }]
      }
    }
  });

  t.deepEqual(request, {
    method: 'post',
    url: 'http://example.com:{$.ctx.var0}/post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: {
      foo: 'bar'
    }
  });
});

test('createInput > creates input without body and headers', (t) => {
  const request = convert.createInput({
    request: {
      url: 'http://example.com:{{var0}}/post',
      method: 'POST'
    }
  });

  t.deepEqual(request, {
    method: 'post',
    url: 'http://example.com:{$.ctx.var0}/post'
  });
});

test('createAuth > creates basic auth with replaced variables', (t) => {
  const auth = convert.createAuth({
    type: 'basic',
    basic: {
      username: '{{username}}',
      password: 'password'
    }
  });

  t.deepEqual(auth, {
    type: 'basic',
    username: '{$.ctx.username}',
    password: 'password'
  });
});

test('createAuth > creates oauth1 auth with replaced variables', (t) => {
  const auth = convert.createAuth({
    type: 'oauth1',
    oauth1: {
      consumerKey: 'consumer_key',
      consumerSecret: 'consumer_secret',
      token: 'token1111',
      tokenSecret: '{{tokenSecret}}',
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
    consumerKey: 'consumer_key',
    consumerSecret: 'consumer_secret',
    token: 'token1111',
    tokenSecret: '{$.ctx.tokenSecret}',
    signatureMethod: 'HMAC-SHA256',
    nonceLength: 'lV4Xwg',
    useHeader: true
  });
});

test('createAuth > creates basic auth', (t) => {
  const auth = convert.createAuth({
    type: 'basic',
    basic: {
      username: 'user',
      password: 'password'
    }
  });

  t.deepEqual(auth, {
    type: 'basic',
    username: 'user',
    password: 'password'
  });
});

test('createAuth > returns undefined for unsupported auth type', (t) => {
  const auth = convert.createAuth({
    type: 'unsupported',
    username: 'user',
    password: 'password'
  });

  t.is(auth, undefined);
});

test('createInput > creates input', (t) => {
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
    method: 'post',
    url: 'http://example.com:{$.ctx.var0}/post',
    auth: {
      type: 'basic',
      username: 'user',
      password: 'password'
    }
  });
});

test('createInput > handles undefined input', (t) => {
  t.deepEqual(convert.createInput(), {
    method: 'get',
    url: ''
  });
});

test('createLogic > creates before script from array exec', (t) => {
  const logic = convert.createLogic({
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

  t.deepEqual(logic, {
    script: 'postman.clearGlobalVariable("variable_key");'
  });
});

test('createLogic > creates after script from string exec', (t) => {
  const logic = convert.createLogic({
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

  t.deepEqual(logic, {
    script: 'tests["Body contains headers"] = responseBody.has("headers");'
  });
});

test('createLogic > handles undefined input', (t) => {
  const logic = convert.createLogic({event: []}, 'test');

  t.is(logic, undefined);
});

test('createStep > creates step', (t) => {
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

  t.true(_.isString(step.id), 'Step id should be a string.');
  t.true(step.id.length === 3, 'Step id should be 3 characters long.');

  t.deepEqual(deleteIds(step), {
    type: 'http',
    name: 'Test Item',
    input: {
      method: 'post',
      url: 'http://example.com:{$.ctx.var0}/post',
      auth: {
        type: 'basic',
        username: 'user',
        password: 'password'
      }
    },
    before: {
      script: 'postman.clearGlobalVariable("variable_key");'
    },
    after: {
      script: 'tests["Body contains headers"] = responseBody.has("headers");'
    }
  });
});

test('createStep > handles undefined input', (t) => {
  t.deepEqual(deleteIds(convert.createStep()), {
    type: 'http',
    name: '',
    input: {
      method: 'get',
      url: ''
    }
  });
});

test('createScenario > creates scenario with one step', (t) => {
  const scenario = convert.createScenario({
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

  t.true(_.isString(scenario.id), 'Scenario id should be a string.');
  t.true(scenario.id.length === 3, 'Scenario id should be 3 characters long.');

  t.deepEqual(deleteIds(scenario), {
    name: 'Test Item',
    steps: [{
      type: 'http',
      name: 'Test Item',
      input: {
        method: 'post',
        url: 'http://example.com:{$.ctx.var0}/post',
        auth: {
          type: 'basic',
          username: 'user',
          password: 'password'
        }
      }
    }]
  });
});

test('createScenario > creates scenario with multiple steps', (t) => {
  const scenario = convert.createScenario({
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

  t.deepEqual(deleteIds(scenario), {
      name: 'Test Item',
      steps: [
        {
          type: 'http',
          name: 'Test Subitem 1',
          input: {
            method: 'get',
            url: 'http://example.com:{$.ctx.var0}'
          }
        },
        {
          type: 'http',
          name: 'Test Subitem 2',
          input: {
            method: 'post',
            url: 'http://example.com:{$.ctx.var0}/post'
          }
        }
      ]
    }
  );
});

test('creates scenario collection', (t) => {
  const collection = convert.convert({
    info: {
      name: 'Test collection',
    },
    item: []
  });

  t.deepEqual(collection, {
    name: 'Test collection',
    scenarios: []
  });
});

test('handles undefined input', (t) => {
  t.deepEqual(convert.convert(), []);
});
