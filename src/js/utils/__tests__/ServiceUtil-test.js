jest.dontMock('../ServiceUtil');
jest.dontMock('../../structs/Service');
jest.dontMock('../../constants/VolumeConstants');

var Service = require('../../structs/Service');
var ServiceUtil = require('../ServiceUtil');

describe('ServiceUtil', function () {
  describe('#createServiceFromFormModel', function () {
    it('should convert to the correct Service', function () {
      let model = {
        general: {
          id: '/test',
          cmd: 'sleep 1000;'
        }
      };

      let expectedService = new Service({
        id: '/test',
        cmd: 'sleep 1000;'
      });

      expect(ServiceUtil.createServiceFromFormModel(model))
        .toEqual(expectedService);
    });

    it('should return empty service if null is provided', function () {
      let model = null;

      let expectedService = new Service({});

      expect(ServiceUtil.createServiceFromFormModel(model))
        .toEqual(expectedService);
    });

    it('should return empty service if empty object is provided', function () {
      let model = {};

      let expectedService = new Service({});

      expect(ServiceUtil.createServiceFromFormModel(model))
        .toEqual(expectedService);
    });

    describe('should return a service with', function() {
      it('local Volumes', function () {
        let model = {
          volumes: {
            localVolumes: [{
              containerPath: 'home',
              size: 10
            }]
          }
        };

        let expectedService = new Service({
          container: {
            type: 'MESOS',
            volumes: [{
              containerPath: 'home',
              persistent: {
                size: 10
              },
              mode: 'RW'
            }]
          },
          updateStrategy: {maximumOverCapacity: 0, minimumHealthCapacity: 0},
          residency: {
            relaunchEscalationTimeoutSeconds: 10,
            taskLostBehavior: 'WAIT_FOREVER'
          }
        });

        expect(ServiceUtil.createServiceFromFormModel(model))
          .toEqual(expectedService);
      });

      it('local and docker Volumes', function () {
        let model = {
          containerSettings: {
            image: 'nginx'
          },
          volumes: {
            localVolumes: [{
              containerPath: 'home',
              size: 10
            }],
            dockerVolumes: [{
              containerPath: 'home',
              hostPath: 'home',
              mode: 'rw',
            }]
          }
        };

        let expectedService = new Service({
          container: {
            type: 'DOCKER',
            docker: {
              image: 'nginx'
            },
            volumes: [
              {
                containerPath: 'home',
                hostPath: 'home',
                mode: 'RW'
              },
              {
                containerPath: 'home',
                persistent: {
                  size: 10
                },
                mode: 'RW'
              }
            ]
          },
          updateStrategy: {maximumOverCapacity: 0, minimumHealthCapacity: 0},
          residency: {
            relaunchEscalationTimeoutSeconds: 10,
            taskLostBehavior: 'WAIT_FOREVER'
          }
        });

        expect(ServiceUtil.createServiceFromFormModel(model))
          .toEqual(expectedService);
      });

      it('docker Volumes', function () {
        let model = {
          containerSettings: {
            image: 'nginx'
          },
          volumes: {
            dockerVolumes: [{
              containerPath: 'home',
              hostPath: 'home',
              mode: 'rw',
            }]
          }
        };

        let expectedService = new Service({
          container: {
            type: 'DOCKER',
            docker: {
              image: 'nginx'
            },
            volumes: [
              {
                containerPath: 'home',
                hostPath: 'home',
                mode: 'RW'
              }
            ]
          }
        });

        expect(ServiceUtil.createServiceFromFormModel(model))
          .toEqual(expectedService);
      });

      it('external Volumes', function () {
        let model = {
          volumes: {
            externalVolumes: [{
              containerPath: 'home',
              externalName: 'home'
            }]
          }
        };

        let expectedService = new Service({
          container: {
            type: 'MESOS',
            volumes: [
              {
                containerPath: 'home',
                external: {
                  name: 'home',
                  provider: 'dvdi',
                  options: {
                    'dvdi/driver': 'rexray'
                  }
                },
                mode: 'RW'
              }
            ]
          },
          updateStrategy: {maximumOverCapacity: 0, minimumHealthCapacity: 0}
        });

        expect(ServiceUtil.createServiceFromFormModel(model))
          .toEqual(expectedService);
      });
    })
  });

  describe('#createFormModelFromSchema', function () {
    it('should create the correct model', function () {
      let schema = {
        type: 'object',
        properties: {
          General: {
            description: 'Configure your container',
            type: 'object',
            properties: {
              id: {
                default: '/service',
                title: 'ID',
                description: 'The id for the service',
                type: 'string',
                getter: function (service) {
                  return service.getId();
                }
              },
              cmd: {
                title: 'Command',
                default: 'sleep 1000;',
                description: 'The command which is executed by the service',
                type: 'string',
                multiLine: true,
                getter: function (service) {
                  return service.getCommand();
                }
              }
            }
          }
        },
        required: [
          'General'
        ]
      };

      let service = new Service({
        id: '/test',
        cmd: 'sleep 1000;'
      });

      expect(ServiceUtil.createFormModelFromSchema(schema, service)).toEqual({
        General: {
          id: '/test',
          cmd: 'sleep 1000;'
        }
      });
    });
  });

  describe('#getAppDefinitionFromService', function () {
    it('should create the correct appDefinition', function () {
      let service = new Service({
        id: '/test',
        cmd: 'sleep 1000;'
      });

      expect(ServiceUtil.getAppDefinitionFromService(service)).toEqual({
        id: '/test',
        cmd: 'sleep 1000;'
      });
    });
  });

  describe('#convertServiceLabelsToArray', function ()  {
    it('should return an array of key-value tuples', function () {
      let service = new Service({
        id: '/test',
        cmd: 'sleep 1000;',
        labels: {
          'label_one': 'value_one',
          'label_two': 'value_two'
        }
      });

      let serviceLabels = ServiceUtil.convertServiceLabelsToArray(service);
      expect(serviceLabels.length).toEqual(2);
      expect(serviceLabels).toEqual([
        {key: 'label_one', value: 'value_one'},
        {key: 'label_two', value: 'value_two'}
      ]);
    });

    it('should return an empty array if no labels are found', function () {
      let service = new Service({
        id: '/test',
        cmd: 'sleep 1000;'
      });

      let serviceLabels = ServiceUtil.convertServiceLabelsToArray(service);
      expect(serviceLabels.length).toEqual(0);
      expect(serviceLabels).toEqual([]);
    });

    it('only performs the conversion on a Service', function () {
      let service = {};
      let serviceLabels = ServiceUtil.convertServiceLabelsToArray(service);
      expect(serviceLabels.length).toEqual(0);
      expect(serviceLabels).toEqual([]);
    });
  });

});
