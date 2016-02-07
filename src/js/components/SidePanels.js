import _ from 'underscore';
import React from 'react';
import {SidePanel} from 'reactjs-components';

import HistoryStore from '../stores/HistoryStore';
import MesosSummaryStore from '../stores/MesosSummaryStore';
import NodeSidePanelContents from './NodeSidePanelContents';
import ServiceSidePanelContents from './ServiceSidePanelContents';
import StringUtil from '../utils/StringUtil';
import TaskSidePanelContents from './TaskSidePanelContents';

const METHODS_TO_BIND = [
  'handlePanelClose',
  'handlePanelSizeChange'
];

export default class SidePanels extends React.Component {
  constructor() {
    super();

    METHODS_TO_BIND.forEach(function (method) {
      this[method] = this[method].bind(this);
    }, this);

    this.state = {
      sidePanelSize: 'large'
    };
  }

  handlePanelSizeChange(sidePanelSize) {
    this.setState({sidePanelSize});
  }

  handlePanelClose(closeInfo) {
    if (!this.isOpen()) {
      return;
    }

    this.setState({sidePanelSize: 'large'});

    if (closeInfo && closeInfo.closedByBackdrop) {
      HistoryStore.goBackToPage(this.context.router);
      return;
    }

    HistoryStore.goBack(this.context.router);
  }

  isOpen() {
    let params = this.props.params;

    return (
      params.nodeID != null ||
      params.serviceName != null ||
      params.taskID != null
    ) && MesosSummaryStore.get('statesProcessed');
  }

  getHeader() {
    let text = 'back';
    let prevPage = HistoryStore.getHistoryAt(-1);

    if (prevPage == null) {
      text = 'close';
    }

    if (prevPage) {
      let matchedRoutes = this.context.router.match(prevPage).routes;
      prevPage = _.last(matchedRoutes).name;

      if (this.props.openedPage === prevPage) {
        text = 'close';
      }
    }

    return (
      <div className="side-panel-header-actions
        side-panel-header-actions-primary">
        <span className="side-panel-header-action"
          onClick={this.handlePanelClose}>
          <i className={`icon icon-sprite
            icon-sprite-small
            icon-${text}
            icon-sprite-small-white`}></i>
          {StringUtil.capitalize(text)}
        </span>
      </div>
    );
  }

  getContents(ids) {
    if (!this.isOpen()) {
      return null;
    }

    let {nodeID, serviceName, taskID} = ids;

    if (nodeID != null) {
      return (
        <NodeSidePanelContents
          itemID={nodeID}
          parentRouter={this.context.router} />
      );
    }

    if (taskID != null) {
      return (
        <TaskSidePanelContents
          handlePanelSizeChange={this.handlePanelSizeChange}
          itemID={taskID}
          parentRouter={this.context.router} />
      );
    }

    if (serviceName != null) {
      return (
        <ServiceSidePanelContents
          itemID={serviceName}
          parentRouter={this.context.router} />
      );
    }

    return null;
  }

  getSidePanelClass(size) {
    return (`side-panel flex-container-col container container-pod container-pod-short flush-top flush-bottom side-panel-${size}`);
  }

  render() {
    let params = this.props.params;

    let nodeID = params.nodeID;
    let serviceName = params.serviceName;
    let taskID = params.taskID;

    return (
      <SidePanel className="side-panel-detail"
        header={this.getHeader()}
        headerContainerClass="side-panel-header-container container
          container-fluid container-fluid-narrow container-pod
          container-pod-short"
        bodyClass="side-panel-content flex-container-col"
        onClose={this.handlePanelClose}
        open={this.isOpen()}
        sidePanelClass={this.getSidePanelClass(this.state.sidePanelSize)}>
        {this.getContents({nodeID, serviceName, taskID})}
      </SidePanel>
    );
  }
}

SidePanels.contextTypes = {
  router: React.PropTypes.func
};

SidePanels.propTypes = {
  params: React.PropTypes.object
};
