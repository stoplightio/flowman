import _ from 'lodash';
import * as utils from './utils';

/**
 * Creates headers object from passed request.
 * @param {object} request - Request from which headers will be extracted.
 * @return {object}
 */
export const createRequestHeaders = (request) => {
  const modeHeaders = utils.convertModeToHeader(_.get(request, 'body.mode'));
  let headers = {};

  if (!_.isEmpty(request.header)) {
    request.header.forEach((header) => {
      headers[header.key] = header.value;
    });
  }

  return utils.replaceVariables(_.merge(headers, modeHeaders));
};

/**
 * Creates `key: value` or string request body from passed request.
 * @param request - Request from which body will be extracted.
 * @return {object|string}
 */
export const createRequestBody = (request) => {
  const mode = _.get(request, 'body.mode');
  const body = _.get(request, ['body', mode]);
  let result;

  switch (mode) {
    case 'raw':
      result = body;
      break;
    case 'urlencoded':
    case 'formdata':
      result = body && body.length ? body.reduce((res, {key, value}) =>
        ({...res, [key]: value}), {}) : undefined;
      break;
  }

  return utils.replaceVariables(result);
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

  return utils.replaceVariables(result || '');
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
  let result;

  switch (type) {
    case 'basic':
      result = {
        type,
        [type]: _.pick(authObj, ['username', 'password'])
      };
      break;
    case 'oauth1':
      result = {
        type,
        [type]: {
          ..._.pick(authObj, ['consumerKey', 'consumerSecret',
            'tokenSecret', 'signatureMethod']),
          nonceLength: authObj.nonce,
          useHeader: authObj.addParamsToHeader
        }
      };
      break;
  }

  if (result) {
    result[type] = utils.replaceVariables(result[type]);
  }

  return result;
};

/**
 * Creates Flow input object with request and auth.
 * @param {object} item - Postman item.
 * @return {object}
 */
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

/**
 * Creates Flows script from passed item.
 * @param {object} item - Postman item.
 * @param {string} type - script type. Can be 'prerequest' or 'test'.
 * @return {*}
 */
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

/**
 * Creates Flow function object with input and before/after scripts.
 * @param {object} item - Postman item.
 * @return {object}
 */
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

/**
 * Creates Flow step with one function.
 * @param {object} item - Postman item.
 * @return {object}
 */
export const createStep = (item = {}) => {
  return {
    functions: [createFunction(item)]
  };
};

/**
 * Creates Flow with steps.
 * @param {object} item - Postman item.
 * @return {object}
 */
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

/**
 * Converts Postman collection to FlowCollection.
 * @param {object} collection - Postman collection.
 * @return {object}
 */
export const convert = (collection) => {
  if (_.isEmpty(collection)) {
    return [];
  }

  return {
    name: _.get(collection, 'info.name') || '',
    flows: collection.item.map(createFlow)
  };
};
