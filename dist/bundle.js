function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _ = _interopDefault(require('lodash'));

/**
 * Transforms variables from Postman to Flows format.
 * @param {string} str - string to transform.
 * @return {string}
 */
var convertVariables = function convertVariables(str) {
  return _.isString(str) ? str.replace(/\{\{([^}]+)\}\}/g, '<<!$1>>') : str;
};

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
        var key = _ref.key;
        var value = _ref.value;
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
 * Creates Flow request from passed Postman request.
 * @param itemRequest - Postman request.
 * @return {object}
 */
var createRequest = function createRequest(itemRequest) {
  var request = {
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
 * Creates Flow auth object from Postman auth object.
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
      result = defineProperty({
        type: type
      }, type, _.pick(authObj, ['username', 'password']));
      break;
    case 'oauth1':
      result = defineProperty({
        type: type
      }, type, _extends({}, _.pick(authObj, ['consumerKey', 'consumerSecret', 'tokenSecret', 'signatureMethod']), {
        nonceLength: authObj.nonce,
        useHeader: authObj.addParamsToHeader
      }));
      break;
  }

  if (result) {
    result[type] = replaceVariables(result[type]);
  }

  return result;
};

var createInput = function createInput(item) {
  if (_.isEmpty(item.request)) {
    return null;
  }

  var input = {
    request: createRequest(item.request)
  };
  var auth = createAuth(item.request.auth);

  if (auth) {
    input.authorization = auth;
  }

  return input;
};

var createScript = function createScript(item, type) {
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

var createFunction = function createFunction(item) {
  var fn = {
    input: createInput(item)
  };
  var before = createScript(item, 'prerequest');
  var after = createScript(item, 'test');

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

var createStep = function createStep() {
  var item = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return {
    functions: [createFunction(item)]
  };
};

var createFlow = function createFlow(item) {
  var flow = {
    name: item.name,
    flowVersion: '1.0',
    resourceId: _.kebabCase(item.name),
    steps: []
  };

  if (_.isArray(item.item)) {
    flow.steps = item.item.map(createStep);
  } else {
    flow.steps.push(createStep(item));
  }

  return flow;
};

var convert = function convert(collection) {
  if (_.isEmpty(collection)) {
    return [];
  }

  return {
    name: _.get(collection, 'info.name') || '',
    flows: collection.item.map(createFlow)
  };
};

var index = {
  convert: convert
};

module.exports = index;
