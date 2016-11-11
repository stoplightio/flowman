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
          ..._.pick(authObj, ['consumerKey', 'consumerSecret', 'tokenSecret', 'signatureMethod']),
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
    fn.before = {
      script: before
    }
  }

  if (after) {
    fn.after = {
      script: after
    }
  }

  return fn;
};

const createStep = (item, folder) => {
  return {
    functions: [createFunction(item)],
    id: _.kebabCase(`${folder.name || ''} ${item.name}`)
  };
};

const parseItem = (item, folder) => {
  if (item.item) {
    return walkItems(item.item, _.pick(item, ['name', 'description']));
  }

  return createStep(item, folder);
};

const walkItems = (items, folder = {}) => {
  return items.reduce((res, item) => {
    const parsed = parseItem(item, folder);

    if (!_.isEmpty(parsed)) {
      res.push(parsed);
    }

    return res;
  }, []);
};

export const convert = (collection, options = {}) => {
  const steps = walkItems(collection.item);
  const flow = {
    flowVersion: '1.0',
    ..._.pick(collection.info, ['name', 'description']),
    steps,
  };

  console.log(JSON.stringify(flow, null, 2));

  return flow;
};
