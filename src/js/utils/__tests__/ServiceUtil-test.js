jest.dontMock('../ServiceUtil');
jest.dontMock('../../structs/Service');

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

    describe('networking', function () {

      describe('host mode', function () {

        it('should not add a portDefinitions field if no ports were passed in', function () {
          let service = ServiceUtil.createServiceFromFormModel({
            networkType: 'host',
            networking: { ports: [] }
          });
          expect(service.portDefinitions).not.toBeDefined();
        });

        it('should convert the supplied network fields', function () {
          let service = ServiceUtil.createServiceFromFormModel({
            networkType: 'host',
            networking: {
              ports: [ {protocol: 'udp', name: 'foo'} ]
            }
          });
          expect(service.portDefinitions).toEqual([
            {port: 0, protocol: 'udp', name: 'foo'}
          ]);
        });

        it('should enforce the port when discovery is on', function () {
          let service = ServiceUtil.createServiceFromFormModel({
            networkType: 'host',
            networking: {
              ports: [ {lbPort: 1234, discovery: true} ]
            }
          });
          expect(service.portDefinitions).toEqual([
            {port: 1234, protocol: 'tcp'}
          ]);
        });

        it('should override the port to 0 when discovery is off', function () {
          let service = ServiceUtil.createServiceFromFormModel({
            networkType: 'host',
            networking: {
              ports: [ {lbPort: 1234, discovery: false} ]
            }
          });
          expect(service.portDefinitions).toEqual([
            {port: 0, protocol: 'tcp'}
          ]);
        });

        it('should default the port to 0 when discovery is on', function () {
          let service = ServiceUtil.createServiceFromFormModel({
            networkType: 'host',
            networking: {
              ports: [ {discovery: true} ]
            }
          });
          expect(service.portDefinitions).toEqual([
            {port: 0, protocol: 'tcp'}
          ]);
        });

        describe('an empty networking ports member', function () {

          beforeEach(function () {
            let service = ServiceUtil.createServiceFromFormModel({
              networkType: 'host',
              networking: { ports: [{}] }
            });
            this.portDefinition = service.portDefinitions[0];
          });

          it('defaults port number to 0', function () {
            expect(this.portDefinition.port).toEqual(0);
          });

          it('defaults protocol to tcp', function () {
            expect(this.portDefinition.protocol).toEqual('tcp');
          });

          it('does not include a name by default', function () {
            expect(Object.keys(this.portDefinition)).not.toContain('name');
          });

          it('does not include labels by default', function () {
            expect(Object.keys(this.portDefinition)).not.toContain('labels');
          });

        });

      });

    });
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
                getter: function(service) {
                  return service.getId();
                }
              },
              cmd: {
                title: 'Command',
                default: 'sleep 1000;',
                description: 'The command which is executed by the service',
                type: 'string',
                multiLine: true,
                getter: function(service) {
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
});
