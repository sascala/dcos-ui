import {RequestUtil} from 'mesosphere-shared-reactjs';

import {
  REQUEST_CHRONOS_JOB_DELETE_ERROR,
  REQUEST_CHRONOS_JOB_DELETE_SUCCESS,
  REQUEST_CHRONOS_JOBS_ERROR,
  REQUEST_CHRONOS_JOBS_ONGOING,
  REQUEST_CHRONOS_JOBS_SUCCESS
} from '../constants/ActionTypes';
import AppDispatcher from './AppDispatcher';
import ChronosUtil from '../utils/ChronosUtil';
import Config from '../config/Config';

const ChronosActions = {
  fetchJobs: RequestUtil.debounceOnError(
    Config.getRefreshRate(),
    function (resolve, reject) {
      return function () {
        RequestUtil.json({
          url: `${Config.rootUrl}/chronos/jobs`,
          data: [{name: 'embed', value: 'activeJobs'}],
          success: function (response) {
            try {
              let data = ChronosUtil.parseJobs(response);
              AppDispatcher.handleServerAction({
                type: REQUEST_CHRONOS_JOBS_SUCCESS,
                data
              });
              resolve();
            } catch (error) {
              this.error(error);
            }
          },
          error: function (e) {
            AppDispatcher.handleServerAction({
              type: REQUEST_CHRONOS_JOBS_ERROR,
              data: e.message
            });
            reject();
          },
          hangingRequestCallback: function () {
            AppDispatcher.handleServerAction({
              type: REQUEST_CHRONOS_JOBS_ONGOING
            });
          }
        });
      };
    },
    {delayAfterCount: Config.delayAfterErrorCount}
  ),

  deleteJob: function (jobID, stopCurrentJobRuns = false) {
    RequestUtil.json({
      url: `${Config.rootUrl}/chronos/jobs/${jobID}` +
        `?stopCurrentJobRuns=${stopCurrentJobRuns}`,
      method: 'DELETE',
      success: function () {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_DELETE_SUCCESS,
          jobID
        });
      },
      error: function (xhr) {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_DELETE_ERROR,
          data: RequestUtil.parseResponseBody(xhr),
          jobID,
          xhr
        });
      }
    });
  }
};

if (Config.useFixtures) {
  const jobsFixture = require('../../../tests/_fixtures/chronos/jobs.json');

  if (!global.actionTypes) {
    global.actionTypes = {};
  }

  global.actionTypes.ChronosActions = {
    fetchJobs: {
      event: 'success', success: {response: jobsFixture}
    },
    deleteJob: {
      event: 'success', success: {response: {}}
    }
  };

  Object.keys(global.actionTypes.ChronosActions).forEach(function (method) {
    ChronosActions[method] = RequestUtil.stubRequest(
      ChronosActions, 'ChronosActions', method
    );
  });
}

module.exports = ChronosActions;
