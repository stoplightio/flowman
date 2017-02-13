import _ from 'lodash';

export class Collection {
  constructor(doc) {
    this.scenarioVersion = '1.0';
    this.name = '';
    this.scenarios = [];

    if (_.isString(doc.name)) {
      this.name = doc.name;
    }

    if (_.isArray(doc.scenarios)) {
      this.scenarios = doc.scenarios;
    }
  }
}

export class Scenario {
  constructor(doc) {
    this.scenarioVersion = '1.0';
    this.name = '';
    this.scenarios = [];

    if (_.isString(doc.name)) {
      this.name = doc.name;
    }

    if (_.isArray(doc.scenarios)) {
      this.scenarios = doc.scenarios;
    }
  }
}

