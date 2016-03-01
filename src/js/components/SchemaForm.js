import _ from 'underscore';
import classNames from 'classnames';
import GeminiScrollbar from 'react-gemini-scrollbar';
import React from 'react';
import tv4 from 'tv4';

import FormPanel from './FormPanel';
import SideTabs from './SideTabs';
import SchemaUtil from '../utils/SchemaUtil';

const DEFAULT_FORM_VALUES = {
  array: [],
  boolean: false,
  integer: null,
  number: null,
  string: ''
};

function getDefinitionFromPath(definition, paths) {
  if (definition[paths[0]]) {
    definition = definition[paths[0]];
    paths = paths.slice(1);
  }

  paths.forEach(function (path) {
    if (definition.definition == null) {
      return;
    }

    let nextDefinition = _.find(definition.definition, function (definitionField) {
      return definitionField.name === path || definitionField.title === path;
    });

    if (nextDefinition) {
      definition = nextDefinition;
    }
  });

  return definition;
}

function processFormModel(model, multipleDefinition, prevPath = []) {
  let copy = {};

  Object.keys(model).forEach(function (key) {
    let value = model[key];
    let path = prevPath.concat([key]);

    if (typeof value === 'object' && value !== null) {
      if (value.hasOwnProperty('checked')) {
        value = value.checked;
      } else {
        copy[key] = processFormModel(value, multipleDefinition, path);
      }
      return;
    }

    let definition = getDefinitionFromPath(multipleDefinition, path);
    if (definition == null) {
      return;
    }

    let valueType = definition.valueType;

    if (valueType === 'integer' || valueType === 'number') {
      value = Number(value);
      if (isNaN(value)) {
        value = null;
      }
    }

    if (value === null) {
      value = DEFAULT_FORM_VALUES[valueType];
    }

    if (valueType === 'array' && typeof value === 'string') {
      value = value.split(',').map((val) => { return val.trim(); });
    }

    copy[key] = value;
  });

  return copy;
}

function filteredPaths(combinedPath) {
  return combinedPath.split('/').filter(function (path) {
    return path.length > 0;
  });
}

function parseTV4Error(tv4Error) {
  let errorObj = {
    message: tv4Error.message,
    path: filteredPaths(tv4Error.dataPath)
  };

  let schemaPath = tv4Error.schemaPath.split('/');

  if (tv4Error.code === 302) {
    errorObj.path.push(tv4Error.params.key);
  }

  if (schemaPath[schemaPath.length - 2] === 'items') {
    errorObj.path.pop();
  }

  return errorObj;
}

const METHODS_TO_BIND = [
  'getTriggerSubmit', 'validateForm', 'handleFormChange', 'handleTabClick'
];

class SchemaForm extends React.Component {
  constructor() {
    super();

    this.state = {
      currentTab: '',
      useGemini: false
    };

    METHODS_TO_BIND.forEach((method) => {
      this[method] = this[method].bind(this);
    });

    this.triggerSubmit = function () {};
    global.bigSubmit = this.validateForm;
  }

  componentWillMount() {
    this.multipleDefinition = SchemaUtil.schemaToMultipleDefinition(
      this.props.schema
    );

    this.submitMap = {};
    this.model = {};

    this.setState({
      currentTab: Object.keys(this.multipleDefinition)[0]
    });
  }

  componentDidMount() {
    this.setState({useGemini: false});
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isMobileWidth !== this.props.isMobileWidth) {
      this.setState({useGemini: false});
    }
  }

  componentDidUpdate() {
    if (!this.state.useGemini) {
      this.setState({useGemini: true});
    }
  }

  handleTabClick(tab) {
    this.setState({currentTab: tab});
  }

  handleFormChange(formData, eventObj) {
    if (eventObj.eventType !== 'blur') {
      return;
    }

    this.validateForm(eventObj.fieldName);
  }

  handleFormSubmit(formKey, formModel) {
    this.model[formKey] = formModel;
  }

  validateForm(fieldName) {
    let schema = this.props.schema;
    Object.keys(this.multipleDefinition).forEach((formKey) => {
      this.submitMap[formKey]();
    });

    let prevDefinition = this.multipleDefinition;
    // Reset the definition in order to reset all errors.
    this.multipleDefinition = SchemaUtil.schemaToMultipleDefinition(
      schema
    );

    let model = processFormModel(this.model, this.multipleDefinition);
    let result = tv4.validateMultiple(model, schema);

    let errors = result.errors.map(function (error) {
      return parseTV4Error(error);
    });

    errors.forEach((error) => {
      let path = error.path;
      let prevObj = prevDefinition[path[0]];
      prevObj = getDefinitionFromPath(prevObj, path.slice(1));
      if (path[path.length - 1] !== fieldName && !prevObj.showError) {
        return;
      }

      let obj = this.multipleDefinition[path[0]];
      obj = getDefinitionFromPath(obj, path.slice(1));

      if (obj == null) {
        return;
      }

      obj.showError = error.message;
      obj.validationErrorText = error.message;
    });

    this.forceUpdate();
  }

  getTriggerSubmit(formKey, triggerSubmit) {
    this.submitMap[formKey] = triggerSubmit;
  }

  getServiceHeader() {
    return (
      <div className="media-object-spacing-wrapper media-object-spacing-narrow flush">
        <div className="media-object media-object-align-middle">
          <div className="media-object-item">
            <img
              className="icon icon-sprite icon-sprite-medium
                icon-sprite-medium-color"
              src={this.props.serviceImage} />
          </div>
          <div className="media-object-item">
            <h4 className="flush-top flush-bottom text-color-neutral">
              {this.props.serviceName}
            </h4>
            <span className="side-panel-resource-label">
              {this.props.serviceVersion}
            </span>
          </div>
        </div>
      </div>
    );
  }

  getSideContent(multipleDefinition) {
    let currentTab = this.state.currentTab;
    let {handleTabClick} = this;
    let isMobileWidth = this.props.isMobileWidth;
    let tabValues = _.values(multipleDefinition);

    let content = (
      <SideTabs
        isMobileWidth={isMobileWidth}
        onTabClick={handleTabClick}
        selectedTab={currentTab}
        tabs={tabValues} />
    );

    let classSet = classNames({
      'column-4': !isMobileWidth,
      'column-12 mobile-column': isMobileWidth
    });

    if (this.state.useGemini && !isMobileWidth) {
      return (
        <GeminiScrollbar autoshow={true} className={classSet}>
          <div className="multiple-form-left-column">
            {this.getServiceHeader()}
            {content}
          </div>
        </GeminiScrollbar>
      );
    }

    return (
      <div className={classSet}>
        {this.getServiceHeader()}
        {content}
      </div>
    );
  }

  getFormPanels() {
    let currentTab = this.state.currentTab;
    let multipleDefinition = this.multipleDefinition;
    let formKeys = Object.keys(multipleDefinition);

    let panels = formKeys.map((formKey, i) => {
      let panelClassSet = classNames('form', {
        'hidden': currentTab !== formKey
      });

      return (
        <FormPanel
          className={panelClassSet}
          currentTab={this.state.currentTab}
          definition={multipleDefinition[formKey]}
          getTriggerSubmit={this.getTriggerSubmit.bind(this, formKey)}
          key={i}
          onSubmit={this.handleFormSubmit.bind(this, formKey)}
          onFormChange={this.handleFormChange} />
      );
    });

    let isMobileWidth = this.props.isMobileWidth;
    let classSet = classNames({
      'column-8 multiple-form-right-column': !isMobileWidth,
      'column-12': isMobileWidth
    });

    if (this.state.useGemini) {
      return (
        <GeminiScrollbar autoshow={true} className={classSet}>
          {panels}
        </GeminiScrollbar>
      );
    }

    return (
      <div className={classSet}>
        {panels}
      </div>
    );
  }

  render() {
    let multipleDefinition = this.multipleDefinition;
    let isMobileWidth = this.props.isMobileWidth;

    let classSet = classNames('row row-flex multiple-form', {
       'mobile-width': isMobileWidth
    });

    return (
      <div className={classSet}>
        {this.getSideContent(multipleDefinition)}
        {this.getFormPanels()}
      </div>
    );
  }
}

SchemaForm.defaultProps = {
  schema: {},
  serviceImage: './img/services/icon-service-marathon-large@2x.png',
  serviceName: 'Marathon',
  serviceVersion: '0.23.2'
};

SchemaForm.propTypes = {
  isMobileWidth: React.PropTypes.bool,
  schema: React.PropTypes.object,
  serviceImage: React.PropTypes.string,
  serviceName: React.PropTypes.string,
  serviceVersion: React.PropTypes.string
};

module.exports = SchemaForm;
