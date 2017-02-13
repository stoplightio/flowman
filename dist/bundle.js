function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _ = _interopDefault(require('lodash'));

/**
 * Transforms variables from Postman to Scenario format.
 * @param {string} str - string to transform.
 * @return {string}
 */
var convertVariables = function convertVariables(str) {
  return _.isString(str) ? str.replace(/\{\{([^}]+)\}\}/g, '{$.ctx.$1}') : str;
};

/**
 * Replaces variables in passed string or object fields.
 * @param {object|string} source - data source.
 * @return {object|string}
 */
var replaceVariables = function replaceVariables(source) {
  if (!_.isEmpty(source)) {
    if (_.isString(source)) {
      return convertVariables(source);
    }

    if (_.isPlainObject(source)) {
      return _.mapValues(source, function (val) {
        return _.isString(val) ? convertVariables(val) : val;
      });
    }
  }

  return source;
};

/**
 * Converts Postman body to content type header.
 * @param mode - Postman mode.
 * @return {object}
 */
var convertModeToHeader = function convertModeToHeader(mode) {
  switch (mode) {
    case 'formdata':
    case 'urlencoded':
      return {
        'Content-Type': 'application/x-www-form-urlencoded'
      };
    case 'params':
      return {
        'Content-Type': 'multipart/form-data'
      };
    case 'raw':
      return {};
    default:
      return {};
  }
};

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();













var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

















var set = function set(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};

/**
 * Creates headers object from passed request.
 * @param {object} request - Request from which headers will be extracted.
 * @return {object}
 */
var createRequestHeaders = function createRequestHeaders(request) {
  var modeHeaders = convertModeToHeader(_.get(request, 'body.mode'));
  var headers = {};

  if (!_.isEmpty(request.header)) {
    request.header.forEach(function (header) {
      headers[header.key] = header.value;
    });
  }

  return replaceVariables(_.merge(headers, modeHeaders));
};

/**
 * Creates `key: value` or string request body from passed request.
 * @param request - Request from which body will be extracted.
 * @return {object|string}
 */
var createRequestBody = function createRequestBody(request) {
  var mode = _.get(request, 'body.mode');
  var body = _.get(request, ['body', mode]);
  var result = void 0;

  switch (mode) {
    case 'raw':
      result = body;
      break;
    case 'urlencoded':
    case 'formdata':
      result = body && body.length ? body.reduce(function (res, _ref) {
        var key = _ref.key,
            value = _ref.value;
        return _extends({}, res, defineProperty({}, key, value));
      }, {}) : undefined;
      break;
  }

  return replaceVariables(result);
};

/**
 * Returns parsed URL with replaced variables.
 * @param {string|object} url - url to parse.
 * @return {string}
 */
var getURL = function getURL(url) {
  var result = url;

  if (_.isObject(url)) {
    result = url.raw;
  }

  return replaceVariables(result || '');
};

/**
 * Creates Scenario request from passed Postman request.
 * @param itemRequest - Postman request.
 * @return {object}
 */
var createRequest = function createRequest(itemRequest) {
  var request = {
    // TODO filter methods according to https://help.stoplight.io/scenarios/http/input
    method: itemRequest.method.toLowerCase(),
    url: getURL(itemRequest.url)
  };
  var headers = createRequestHeaders(itemRequest);
  var body = createRequestBody(itemRequest);

  if (!_.isEmpty(headers)) {
    request.headers = headers;
  }

  if (!_.isUndefined(body)) {
    request.body = body;
  }

  return request;
};

/**
 * Creates Scenario auth object from Postman auth object.
 * @param {object} auth - Postman auth object.
 * @return {object}
 */
var createAuth = function createAuth() {
  var auth = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var type = auth.type;

  var authObj = auth[type];
  var result = void 0;

  switch (type) {
    case 'basic':
      result = _.pick(authObj, ['username', 'password']);
      break;
    case 'oauth1':
      result = _extends({}, _.pick(authObj, ['consumerKey', 'consumerSecret', 'token', 'tokenSecret', 'signatureMethod']), {
        nonceLength: authObj.nonce,
        useHeader: authObj.addParamsToHeader
      });
      break;
  }

  if (result) {
    result = _extends({
      type: type
    }, replaceVariables(result));
  }

  return result;
};

/**
 * Creates Scenario Input object.
 * @param {object} item - Postman item.
 * @return {object}
 */
var createInput = function createInput(item) {
  if (_.isEmpty(item.request)) {
    return null;
  }

  var request = createRequest(item.request);
  var auth = createAuth(item.request.auth);
  var input = Object.assign({}, request);

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
var createLogic = function createLogic(item, type) {
  var event = _.find(item.event, { listen: type });

  if (event) {
    var exec = event.script.exec;


    if (_.isArray(exec)) {
      return {
        script: exec.join('\n')
      };
    }

    return {
      script: _.toString(exec)
    };
  }
};

/**
 * Creates Scenario Step.
 * @param {object} item - Postman item.
 * @return {object}
 */
var createStep = function createStep() {
  var item = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var step = {
    type: 'http',
    name: item.name || ''
  };
  var input = createInput(item);
  var before = createLogic(item, 'prerequest');
  var after = createLogic(item, 'test');

  if (input) {
    step.input = input;
  }

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
var createScenario = function createScenario(item) {
  var scenario = {
    name: item.name || '',
    description: item.description || '',
    steps: []
  };

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
var convert = function convert(collection) {
  if (_.isEmpty(collection)) {
    return [];
  }

  return {
    name: _.get(collection, 'info.name') || '',
    scenarios: collection.item.map(createScenario)
  };
};

var index = {
  convert: convert
};

module.exports = index;
