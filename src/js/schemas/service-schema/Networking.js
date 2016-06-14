const Networking = {
  type: 'object',
  title: 'Network',
  description: 'Something about configuring networks and ports and so forth.',
  properties: {
    networkType: {
      fieldType: 'select',
      options: [
        'Host (Default)',
        'Bridge',
        'Virtual Network: Dev',
        'Virtual Network: Prod'
      ],
      getter: function () {
        return null;
      }
    },
    ports: {
      title: 'Service Endpoints',
      description: 'Define the ports and endpoints for your service',
      type: 'array',
      duplicable: true,
      addLabel: 'Add an endpoint',
      getter: function (service) {
        let portMappings = service.getPortDefinitions();

        if (portMappings == null) {
          let container = service.getContainerSettings();
          if (container && container.docker && container.docker.portMappings) {
            portMappings = container.docker.portMappings;
          }

          if (portMappings == null) {
            return null;
          }
        }

        return portMappings.map(function (portMapping) {
          return {
            lbPort: portMapping.hostPort || portMapping.containerPort,
            name: portMapping.name,
            protocol: portMapping.protocol
          };
        });
      },
      itemShape: {
        properties: {
          lbPort: {
            title: 'LB Port',
            type: 'number'
          },
          name: {
            title: 'Name',
            type: 'string'
          },
          protocol: {
            title: 'Protocol',
            type: 'string',
            fieldType: 'select',
            options: ['tcp', 'udp', 'udp,tcp']
          },
          discovery: {
            title: 'Discovery',
            type: 'boolean'
          }
        }
      }
    }
  }
};

module.exports = Networking;
