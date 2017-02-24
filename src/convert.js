import _ from 'lodash';
import shortid from 'shortid';
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
 * Generates random ID string 3 characters long.
 * @return {string}
 */
export const generateId = () => {
  return shortid.generate().substring(0, 3).toLowerCase();
};

/**
 * Creates Scenario auth object from Postman auth object.
 * @param {object} auth - Postman auth object.
 * @return {object}
 */
export const createAuth = (auth = {}) => {
  const {type} = auth;
  const authObj = auth[type];
  let result;

  switch (type) {
    case 'basic':
      result = _.pick(authObj, ['username', 'password']);
      break;
    case 'oauth1':
      result = {
        ..._.pick(authObj, ['consumerKey', 'consumerSecret', 'token',
          'tokenSecret', 'signatureMethod']),
        nonceLength: authObj.nonce,
        useHeader: authObj.addParamsToHeader
      };
      break;
  }

  if (result) {
    result = {
      type,
      ...utils.replaceVariables(result),
    };
  }

  return result;
};

/**
 * Creates Scenario Input object.
 * @param {object} item - Postman item.
 * @return {object}
 */
export const createInput = ({request = {}} = {}) => {
  const allowedMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
  const method = _.lowerCase(request.method);
  const input = {
    method: allowedMethods.includes(method) ? method : 'get',
    url: getURL(request.url),
  };

  const headers = createRequestHeaders(request);
  const body = createRequestBody(request);
  const auth = createAuth(request.auth);

  if (!_.isEmpty(headers)) {
    input.headers = headers;
  }

  if (!_.isUndefined(body)) {
    input.body = body;
  }

  if (auth) {
    input.auth = auth;
  }

  return input;
};

/**
 * Creates Scenarios Logic from passed item.
 * @param {object} item - Postman item.
 * @param {string} type - script type. Can be 'prerequest' or 'test'.
 * @return {*}
 */
export const createLogic = (item, type) => {
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
 * Creates Scenario Step.
 * @param {object} item - Postman item.
 * @return {object}
 */
export const createStep = (item = {}) => {
  const step = {
    id: generateId(),
    type: 'http',
    name: item.name || '',
    input: createInput(item)
  };
  const before = createLogic(item, 'prerequest');
  const after = createLogic(item, 'test');

  if (before) {
    step.before = before;
  }

  if (after) {
    step.after = after;
  }

  return step;
};

/**
 * Creates Scenario with steps.
 * @param {object} item - Postman item.
 * @return {object}
 */
export const createScenario = (item) => {
  const scenario = {
    id: generateId(),
    name: item.name || '',
    steps: [],
  };

  if (item.description) {
    scenario.description = item.description;
  }

  if (_.isArray(item.item)) {
    scenario.steps = item.item.map(createStep);
  } else {
    scenario.steps.push(createStep(item));
  }

  return scenario;
};

/**
 * Converts Postman collection to Collection.
 * @param {object} collection - Postman collection.
 * @return {object}
 */
export const convert = (collection) => {
  if (_.isEmpty(collection)) {
    return [];
  }

  let scenarios = _.get(collection, 'scenarios', []);

  if (!_.isEmpty(collection.item)) {
    // Get two-dimensional array of scenarios and steps for ungrouped scenario
    const [grouped, ungrouped] = collection.item.reduce(([grouped, ungrouped], item) => {
      if (_.isArray(item.item)) {
        grouped.push(createScenario(item));
      } else {
        ungrouped.push(createStep(item));
      }

      return [grouped, ungrouped];
    }, [[], []]);

    scenarios = scenarios.concat(grouped);

    // Group all ungrouped requests (steps) into "Ungrouped" scenario
    if (ungrouped.length) {
      scenarios.push({
        id: generateId(),
        name: 'Ungrouped',
        steps: ungrouped,
      });
    }
  }

  return {
    name: _.get(collection, 'name') || _.get(collection, 'info.name') || '',
    scenarios,
  };
};
