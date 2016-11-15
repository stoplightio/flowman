import _ from 'lodash';
import * as utils from './utils';

/**
 * Creates headers object from passed request.
 * @param {object} request - Request from which headers will be extracted.
 * @return {object}
 */
export const createRequestHeaders = (request) => {
  const headers = {};
  const modeHeaders = utils.convertModeToHeader(_.get(request, 'body.mode'));

  if (!_.isEmpty(request.header)) {
    request.header.forEach((header) => {
      headers[header.key] = header.value;
    });
  }

  return _.merge(headers, modeHeaders);
};

/**
 * Creates `key: value` or string request body from passed request.
 * @param request - Request from which body will be extracted.
 * @return {object|string}
 */
export const createRequestBody = (request) => {
  const mode = _.get(request, 'body.mode');
  const body = _.get(request, ['body', mode]);

  switch (mode) {
    case 'raw':
      return body;
    case 'urlencoded':
    case 'formdata':
      return body && body.length ? body.reduce((res, {key, value}) =>
        ({...res, [key]: value}), {}) : undefined;
    default:
      return;
  }
};

/**
 * Returns parsed URL with replaced variables.
 * @param {string|object} url - url to parse.
 * @return {string}
 */
export const getURL = (url) => {
  let result = url;

  if (_.isObject(url)) {
    result = url.raw;
  }

  return utils.convertVariables(result || '');
};

/**
 * Creates Flow request from passed Postman request.
 * @param itemRequest - Postman request.
 * @return {object}
 */
export const createRequest = (itemRequest) => {
  const request = {
    method: itemRequest.method.toLowerCase(),
    url: getURL(itemRequest.url)
  };
  const headers = createRequestHeaders(itemRequest);
  const body = createRequestBody(itemRequest);

  if (!_.isEmpty(headers)) {
    request.headers = headers;
  }

  if (!_.isUndefined(body)) {
    request.body = body;
  }

  return request;
};

/**
 * Creates Flow auth object from Postman auth object.
 * @param {object} auth - Postman auth object.
 * @return {object}
 */
export const createAuth = (auth = {}) => {
  const {type} = auth;
  const authObj = auth[type];

  switch (type) {
    case 'basic':
      return {
        type,
        [type]: _.pick(authObj, ['username', 'password'])
      };
    case 'oauth1':
      return {
        type,
        [type]: {
          ..._.pick(authObj, ['consumerKey', 'consumerSecret',
            'tokenSecret', 'signatureMethod']),
          nonceLength: authObj.nonce,
          useHeader: authObj.addParamsToHeader
        }
      };
    default:
      return;
  }
};

export const createInput = (item) => {
  if (_.isEmpty(item.request)) {
    return null;
  }

  const input = {
    request: createRequest(item.request)
  };
  const auth = createAuth(item.request.auth);

  if (auth) {
    input.authorization = auth;
  }

  return input;
};

export const createScript = (item, type) => {
  const event = _.find(item.event, {listen: type});

  if (event) {
    const {exec} = event.script;

    if (_.isArray(exec)) {
      return {
        script: exec.join('\n')
      }
    }

    return {
      script: _.toString(exec)
    }
  }
};

export const createFunction = (item) => {
  const fn = {
    input: createInput(item)
  };
  const before = createScript(item, 'prerequest');
  const after = createScript(item, 'test');

  if (item.name) {
    fn.name = item.name;
  }

  if (before) {
    fn.before = before;
  }

  if (after) {
    fn.after = after;
  }

  return fn;
};

export const createStep = (item = {}) => {
  return {
    functions: [createFunction(item)]
  };
};

export const createFlow = (item) => {
  const flow = {
    name: item.name,
    flowVersion: '1.0',
    resourceId: _.kebabCase(item.name),
    steps: [],
  };

  if (_.isArray(item.item)) {
    flow.steps = item.item.map(createStep);
  } else {
    flow.steps.push(createStep(item));
  }

  return flow;
};

export const convert = (collection) => {
  if (_.isEmpty(collection)) {
    return [];
  }

  return {
    name: _.get(collection, 'info.name') || '',
    flows: collection.item.map(createFlow)
  };
};
