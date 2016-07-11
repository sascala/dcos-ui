/* eslint-disable no-unused-vars */
import React from 'react';
/* eslint-enable no-unused-vars */

let General = {
  title: 'General',
  description: {
    <span>
    Configure your container here or <a href="/#/universe/">install from Universe</a>.
    </span>
  },
  type: 'object',
  properties: {
    id: {
      title: 'ID',
      description: 'The service ID.',
      type: 'string',
      getter: function (service) {
        return service.getId();
      }
    },
    resources: {
      type: 'group',
      properties: {
        cpus: {
          title: 'CPUs',
          description: 'The amount of CPUs the service requires.',
          type: 'number',
          default: 1,
          getter: function (service) {
            return `${service.getCpus() || this.default}`;
          }
        },
        mem: {
          title: 'Mem (MiB)',
          type: 'number',
          default: 128,
          getter: function (service) {
            return `${service.getMem() || this.default}`;
          }
        },
        disk: {
          title: 'Disk (MiB)',
          type: 'number',
          default: 0,
          getter: function (service) {
            return `${service.getDisk() || this.default}`;
          }
        },
        instances: {
          title: 'Instances',
          type: 'number',
          default: 1,
          getter: function (service) {
            return `${service.getInstancesCount() || this.default}`;
          }
        }
      }
    },
    cmd: {
      title: 'Command',
      description: 'The command executed by the service.',
      type: 'string',
      multiLine: true,
      getter: function (service) {
        return service.getCommand();
      }
    }
  },
  required: [
    'id'
  ]
};

module.exports = General;
