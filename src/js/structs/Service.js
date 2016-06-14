import HealthStatus from '../constants/HealthStatus';
import Item from './Item';
import ServiceImages from '../constants/ServiceImages';
import ServiceStatus from '../constants/ServiceStatus';
import TaskStats from './TaskStats';
import VolumeList from './VolumeList';

module.exports = class Service extends Item {
  getArguments() {
    return this.get('args');
  }

  getCommand() {
    return this.get('cmd');
  }

  getContainerSettings() {
    return this.get('container');
  }

  getCpus() {
    return this.get('cpus');
  }

  getContainer() {
    return this.get('container');
  }

  getConstraints() {
    return this.get('constraints');
  }

  getDeployments() {
    return this.get('deployments');
  }

  getDisk() {
    return this.get('disk');
  }

  getExecutor() {
    return this.get('executor');
  }

  getAcceptedResourceRoles() {
    return this.get('acceptedResourceRoles');
  }

  getHealth() {
    let {tasksHealthy, tasksUnhealthy, tasksRunning} = this.getTasksSummary();

    if (tasksUnhealthy > 0) {
      return HealthStatus.UNHEALTHY;
    }

    if (tasksRunning > 0 && tasksHealthy === tasksRunning) {
      return HealthStatus.HEALTHY;
    }

    if (this.getHealthChecks() && tasksRunning === 0) {
      return HealthStatus.IDLE;
    }

    return HealthStatus.NA;
  }

  getHealthChecks() {
    return this.get('healthChecks');
  }

  getId() {
    return this.get('id') || '';
  }

  getImages() {
    return this.get('images') || ServiceImages.NA_IMAGES;
  }

  getInstancesCount() {
    return this.get('instances');
  }

  getLabels() {
    return this.get('labels');
  }

  getLastConfigChange() {
    return this.getVersionInfo().lastConfigChangeAt;
  }

  getLastScaled() {
    return this.getVersionInfo().lastScalingAt;
  }

  getLastTaskFailure() {
    return this.get('lastTaskFailure');
  }

  getMem() {
    return this.get('mem');
  }

  getName() {
    return this.getId().split('/').pop();
  }

  getPorts() {
    return this.get('ports');
  }

  getPortDefinitions() {
    return this.get('portDefinitions');
  }

  getResources() {
    return {
      cpus: this.get('cpus'),
      mem: this.get('mem'),
      disk: this.get('disk')
    };
  }

  getStatus() {
    const status = this.getServiceStatus();
    if (status.displayName == null) {
      return null;
    }

    return status.displayName;
  }

  getServiceStatus() {
    let {tasksRunning} = this.getTasksSummary();
    let deployments = this.getDeployments();
    let queue = this.getQueue();

    if (queue != null && queue.delay) {
      if (queue.delay.overdue) {
        return ServiceStatus.WAITING;
      }

      return ServiceStatus.DELAYED;
    }

    if (deployments.length > 0) {
      return ServiceStatus.DEPLOYING;
    }

    if (tasksRunning > 0) {
      return ServiceStatus.RUNNING;
    }

    let instances = this.getInstancesCount();
    if (instances === 0) {
      return ServiceStatus.SUSPENDED;
    }

    return ServiceStatus.NA;
  }

  getTasksSummary() {
    return {
      tasksHealthy: this.get('tasksHealthy'),
      tasksRunning: this.get('tasksRunning'),
      tasksStaged: this.get('tasksStaged'),
      tasksUnhealthy: this.get('tasksUnhealthy'),
      tasksUnknown: this.get('tasksRunning') -
        this.get('tasksHealthy') - this.get('tasksUnhealthy'),
    };
  }

  getTaskStats() {
    return new TaskStats(this.get('taskStats'));
  }

  getFetch() {
    return this.get('fetch');
  }

  getQueue() {
    return this.get('queue');
  }

  getUser() {
    return this.get('user');
  }

  getVersions() {
    return this.get('versions') || new Map();
  }

  getVersionInfo() {
    let currentVersionID = this.get('version');
    let {lastConfigChangeAt, lastScalingAt} =  this.get('versionInfo');

    return {lastConfigChangeAt, lastScalingAt, currentVersionID};
  }

  getVolumes() {
    return new VolumeList({items: this.get('volumes') || []});
  }
};
