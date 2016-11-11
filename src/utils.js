import _ from 'lodash';

export const transformVariables = (val) => (
  _.isString(val) ? val.replace(/\{\{([^}]+)\}\}/g, '<<!$1>>') : val
);

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
