import React from "react/addons";
import _ from "underscore";

import Cluster from "../utils/Cluster";
import EventTypes from "../constants/EventTypes";
import HealthLabels from "../constants/HealthLabels";
import HistoryStore from "../stores/HistoryStore";
import InternalStorageMixin from "../mixins/InternalStorageMixin";
import MarathonStore from "../stores/MarathonStore";
import MesosSummaryStore from "../stores/MesosSummaryStore";
import Plugins from "../plugins/Plugins";
import StringUtil from "../utils/StringUtil";
import Util from "../utils/Util";

const PropTypes = React.PropTypes;

export default class ServiceOverlay extends Util.mixin(InternalStorageMixin) {

  constructor() {
    super();

    const methodsToBind = [
      "handleServiceClose",
      "onMesosSummaryChange",
      "removeMesosStateListeners"
    ];

    methodsToBind.forEach(function (method) {
      this[method] = this[method].bind(this);
    }, this);
  }

  shouldComponentUpdate(nextProps) {
    let currentService = this.props.params.serviceName;
    let nextService = nextProps.params.serviceName;

    if (nextService && currentService !== nextService) {
      this.removeOverlay();
      this.findAndRenderService(nextService);
    }

    return false;
  }

  componentDidMount() {
    // Next tick so that the history actually updates correctly
    setTimeout(() => {
      this.internalStorage_update({
        prevHistoryPath: HistoryStore.getHistoryAt(-1)
      });
    });

    if (MesosSummaryStore.get("statesProcessed")) {
      this.findAndRenderService(this.props.params.serviceName);
    } else {
      this.addMesosStateListeners();
    }
  }

  componentWillUnmount() {
    let overlayEl = this.internalStorage_get().overlayEl;

    if (overlayEl) {
      this.removeOverlay();
      this.props.onServiceClose();
    }
  }

  addMesosStateListeners() {
    MesosSummaryStore.addChangeListener(
      EventTypes.MESOS_SUMMARY_CHANGE, this.onMesosSummaryChange
    );
  }

  removeMesosStateListeners() {
    MesosSummaryStore.removeChangeListener(
      EventTypes.MESOS_SUMMARY_CHANGE, this.onMesosSummaryChange
    );
  }

  onMesosSummaryChange() {
    if (MesosSummaryStore.get("statesProcessed")) {
      // Once we have the data we need (frameworks), stop listening for changes.
      this.removeMesosStateListeners();
      this.findAndRenderService();
    }
  }

  removeOverlay() {
    let overlayEl = this.internalStorage_get().overlayEl;

    if (!overlayEl) {
      return;
    }

    // Remove the div that we created at the root of the dom.
    React.unmountComponentAtNode(overlayEl);
    document.body.removeChild(overlayEl);
    this.internalStorage_update({overlayEl: null});
  }

  handleServiceClose() {
    let path = this.internalStorage_get().prevHistoryPath;
    let routeName = "services-panel";
    let serviceName = this.props.params.serviceName;

    if (path) {
      let matchedRoutes = this.context.router.match(path).routes;
      if (matchedRoutes[matchedRoutes.length - 1]) {
        routeName = matchedRoutes[matchedRoutes.length - 1].name;
      }
    }

    this.context.router.transitionTo(routeName, {serviceName});
  }

  findAndRenderService() {
    let serviceName = this.props.params.serviceName;
    let service = MesosSummaryStore.getServiceFromName(serviceName);

    // Did not find a service.
    if (!service) {
      this.context.router.transitionTo("services");
      this.context.router.transitionTo("services-panel", {serviceName});
      return;
    }

    this.renderService();
  }

  getNewWindowButton(serviceName) {
    var link = (
      <a href={Cluster.getServiceLink(serviceName)}
        target="_blank"
        title="Open in a new window"
        className="overlay-header-action"
        >
        <span className="overlay-short-top">Open in a New Window</span>
        <i className="icon icon-sprite icon-sprite-small icon-new-window icon-sprite-small-white"></i>
      </a>
    );

    return Plugins.applyFilter("renderOverlayNewWindowButton", link);
  }

  getServiceNav(service) {
    let appHealth = MarathonStore.getServiceHealth(service.name);
    let serviceHealth = HealthLabels[appHealth.key];
    let taskCount = "";

    if (_.isNumber(service.TASK_RUNNING)) {
      let pluralized = StringUtil.pluralize("task", service.TASK_RUNNING);
      taskCount = ` (${service.TASK_RUNNING} ${pluralized})`;
    }

    if (serviceHealth === "N/A") {
      serviceHealth = "Health N/A";
    }

    return (
      <div className="overlay-header">
        <div className="overlay-header-container container container-fluid container-fluid-narrow container-pod container-pod-short">
          <div className="overlay-header-actions overlay-header-actions-primary">
            <span className="overlay-header-action"
              onClick={this.handleServiceClose}>
              <i className="icon icon-sprite icon-sprite-small icon-back icon-sprite-small-white"></i>
              <span className="overlay-short-top">Back</span>
            </span>
          </div>
          <div className="overlay-header-content text-align-center">
            <h4 className="overlay-header-content-title inverse flush">
              {service.name}
            </h4>
            <div className="overlay-header-content-subtitle inverse flush">
              {serviceHealth + taskCount}
            </div>
          </div>
          <div className="overlay-header-actions overlay-header-actions-secondary">
            {this.getNewWindowButton(service.name)}
          </div>
        </div>
      </div>
    );
  }

  renderService() {
    // Create a new div and append to body in order
    // to always be full screen.
    let overlayEl = document.createElement("div");
    overlayEl.className = "overlay overlay-service";
    document.body.appendChild(overlayEl);

    this.internalStorage_update({overlayEl});

    let serviceName = this.props.params.serviceName;
    let service = MesosSummaryStore.getServiceFromName(serviceName);

    React.render(
      <div className="overlay-container">
        {this.getServiceNav(service)}
        <iframe
          src={Cluster.getServiceLink(service.name)}
          className="overlay-content" />
      </div>,
      overlayEl
    );
  }

  render() {
    return null;
  }
}

ServiceOverlay.propTypes = {
  onServiceClose: PropTypes.func,
  shouldOpen: PropTypes.bool
};

ServiceOverlay.defaultProps = {
  onServiceClose: function () {},
  shouldOpen: false
};

ServiceOverlay.contextTypes = {
  router: React.PropTypes.func
};
