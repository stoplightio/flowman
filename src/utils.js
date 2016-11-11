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
