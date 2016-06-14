import Service from '../structs/Service';

const getFindPropertiesRecursive = function (service, item) {

  return Object.keys(item).reduce(function (memo, subItem) {
    if (item[subItem].type === 'object') {
      memo[subItem] = getFindPropertiesRecursive(service, item[subItem].properties);

      return memo;
    }

    memo[subItem] = item[subItem].default;

    if (item[subItem].getter) {
      memo[subItem] = item[subItem].getter(service);
    }

    return memo;
  }, {});
};

const ServiceUtil = {
  createServiceFromFormModel: function (formModel) {
    let definition = {};

    if (formModel != null) {
      let {
        general,
        optional,
        containerSettings,
        labels,
        networking
      } = formModel;

      if (general != null) {
        definition.id = general.id;
        definition.cmd = general.cmd;
        definition.cpus = general.cpus;
        definition.mem = general.mem;
        definition.disk = general.disk;
        definition.instances = general.instances;
      }

      if (optional != null) {
        definition.executor = optional.executor;
        definition.fetch = optional.uris &&
          optional.uris.split(',')
            .map(function (uri) {
              return {uri: uri.trim()};
            });
        definition.constraints = optional.constraints &&
          optional.constraints.split(',')
            .map(function (item) {
              return item.split(':')
            });
        definition.acceptedResourceRoles =
          optional.acceptedResourceRoles &&
            optional.acceptedResourceRoles.split(',')
              .map(function (item) {
                return item.trim();
              });
        definition.user = optional.user;
      }

      if (containerSettings != null) {
        definition.container = {
          docker: {
            image: containerSettings.image
          }
        };
        if (containerSettings.network != null) {
          definition.container.docker.network =
            containerSettings.network.toUpperCase();
        }
        if (containerSettings.forcePullImage != null) {
          definition.container.docker.forcePullImage =
            containerSettings.forcePullImage;
        }
        if (containerSettings.privileged != null) {
          definition.container.docker.privileged =
            containerSettings.privileged;
        }
        if (containerSettings.parameters != null) {
          definition.container.docker.parameters =
            containerSettings.parameters.reduce(function (memo, item) {
              memo[item.key] = item.value;
              return memo;
            }, {});
        }
      }

      if (labels != null && labels.labels != null) {
        definition.labels = labels.labels.reduce(function (memo, item) {
          memo[item.key] = item.value;
          return memo;
        }, {});
      }

      if (networking != null) {
        if (networking.ports != null) {
          if (containerSettings != null && containerSettings.image != null) {
            definition.container.docker.portMappings = networking.ports.map(function (port) {
              let portMapping = {
                name: port.name,
                protocol: port.protocol || 'tcp'
              };

              if (/host/.test(networking.networkType) ||
                networking.networkType == null) {
                portMapping.hostPort = parseInt(port.lbPort, 10);
              } else if (/bridge/.test(networking.networkType)) {
                portMapping.containerPort = parseInt(port.lbPort, 10);
              }

              return portMapping;
            });
          } else {
            definition.portDefinitions = networking.ports.map(function (port) {
              let portMapping = {
                port: parseInt(port.lbPort, 10),
                name: port.name,
                protocol: port.protocol || 'tcp'
              };

              return portMapping;
            });
          }
        }
      }
    }
    return new Service(definition);
  },

  createFormModelFromSchema: function (schema, service = new Service()) {

    return getFindPropertiesRecursive(service, schema.properties);
  },

  getAppDefinitionFromService: function (service) {
    let appDefinition = {};

    // General
    appDefinition.id = service.getId();
    appDefinition.cpus = service.getCpus();
    appDefinition.mem = service.getMem();
    appDefinition.disk = service.getDisk();
    appDefinition.instances = service.getInstancesCount();
    appDefinition.cmd = service.getCommand();

    // Optional
    appDefinition.executor = service.getExecutor();
    appDefinition.fetch = service.getFetch();
    appDefinition.constraints = service.getConstraints();
    appDefinition.acceptedResourceRoles = service.getAcceptedResourceRoles();
    appDefinition.user = service.getUser();
    appDefinition.labels = service.getLabels();

    let containerSettings = service.getContainerSettings();
    if (containerSettings &&
      containerSettings.docker &&
      containerSettings.docker.image
    ) {
      appDefinition.container = containerSettings;
    }

    Object.keys(appDefinition).forEach(function (key) {
      if (appDefinition[key] == null) {
        delete appDefinition[key];
      }
    });

    return appDefinition;
  }
};

module.exports = ServiceUtil;
