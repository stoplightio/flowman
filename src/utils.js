import _ from 'lodash';

/**
 * Transforms variables from Postman to Flows format.
 * @param {string} str - string to transform.
 * @return {string}
 */
export const convertVariables = (str) => (
  _.isString(str) ? str.replace(/\{\{([^}]+)\}\}/g, '<<!$1>>') : str
);

/**
 * Replaces variables in passed string or object fields.
 * @param {object|string} source - data source.
 * @return {object|string}
 */
export const replaceVariables = (source) => {
  if (!_.isEmpty(source)) {
    if (_.isString(source)) {
      return convertVariables(source);
    }

    if (_.isPlainObject(source)) {
      return _.mapValues(source,
        val => _.isString(val) ? convertVariables(val) : val);
    }
  }

  return source;
};

/**
 * Converts Postman body to content type header.
 * @param mode - Postman mode.
 * @return {object}
 */
export const convertModeToHeader = (mode) => {
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
