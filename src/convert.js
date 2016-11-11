import _ from 'lodash';
import * as utils from './utils';

const createRequestHeaders = (request) => {
  const headers = {};
  const modeHeaders = utils.convertModeToHeader(_.get(request, 'body.mode'));

  if (!_.isEmpty(request.header)) {
    request.header.forEach((header) => {
      headers[header.key] = header.value;
    });
  }

  return _.merge(headers, modeHeaders);
};

const createRequestBody = (request) => {
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

const createRequest = (itemRequest) => {
  const request = {
    method: itemRequest.method.toLowerCase(),
    url: utils.transformVariables(itemRequest.url)
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

const createAuth = (auth = {}) => {
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

const createInput = (item) => {
  return {
    request: createRequest(item.request),
    authorization: createAuth(item.request.auth)
  }
};

const createScript = (item, type) => {
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

const createFunction = (item) => {
  const fn = {
    name: item.name,
    input: createInput(item)
  };
  const before = createScript(item, 'prerequest');
  const after = createScript(item, 'test');

  if (before) {
    fn.before = before;
  }

  if (after) {
    fn.after = after;
  }

  return fn;
};

const createStep = (item) => {
  return {
    functions: [createFunction(item)]
  };
};

const createFlow = (item) => {
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
  return {
    name: _.get(collection, 'info.name'),
    flows: collection.item.map(createFlow)
  };
};
