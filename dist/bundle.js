function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _ = _interopDefault(require('lodash'));
var shortid = _interopDefault(require('shortid'));

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

var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

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
 * Generates random ID string 3 characters long.
 * @return {string}
 */
var generateId = function generateId() {
  return shortid.generate().substring(0, 3).toLowerCase();
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
var createInput = function createInput() {
  var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref2$request = _ref2.request,
      request = _ref2$request === undefined ? {} : _ref2$request;

  var allowedMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
  var method = _.lowerCase(request.method);
  var input = {
    method: allowedMethods.includes(method) ? method : 'get',
    url: getURL(request.url)
  };

  var headers = createRequestHeaders(request);
  var body = createRequestBody(request);
  var auth = createAuth(request.auth);

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
    id: generateId(),
    type: 'http',
    name: item.name || '',
    input: createInput(item)
  };
  var before = createLogic(item, 'prerequest');
  var after = createLogic(item, 'test');

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
    id: generateId(),
    name: item.name || '',
    steps: []
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
var convert = function convert(collection) {
  if (_.isEmpty(collection)) {
    return [];
  }

  var scenarios = _.get(collection, 'scenarios', []);

  if (!_.isEmpty(collection.item)) {
    // Get two-dimensional array of scenarios and steps for ungrouped scenario
    var _collection$item$redu = collection.item.reduce(function (_ref3, item) {
      var _ref4 = slicedToArray(_ref3, 2),
          grouped = _ref4[0],
          ungrouped = _ref4[1];

      if (_.isArray(item.item)) {
        grouped.push(createScenario(item));
      } else {
        ungrouped.push(createStep(item));
      }

      return [grouped, ungrouped];
    }, [[], []]),
        _collection$item$redu2 = slicedToArray(_collection$item$redu, 2),
        grouped = _collection$item$redu2[0],
        ungrouped = _collection$item$redu2[1];

    scenarios = scenarios.concat(grouped);

    // Group all ungrouped requests (steps) into "Ungrouped" scenario
    if (ungrouped.length) {
      scenarios.push({
        id: generateId(),
        name: 'Ungrouped',
        steps: ungrouped
      });
    }
  }

  return {
    name: _.get(collection, 'name') || _.get(collection, 'info.name') || '',
    scenarios: scenarios
  };
};

var index = {
  convert: convert
};

module.exports = index;
