jest.dontMock('../AppDispatcher');
jest.dontMock('../UnitHealthActions');
jest.dontMock('../../config/Config');
jest.dontMock('../../constants/ActionTypes');

import {RequestUtil} from 'mesosphere-shared-reactjs';

var ActionTypes = require('../../constants/ActionTypes');
var AppDispatcher = require('../AppDispatcher');
var Config = require('../../config/Config');
var ChronosActions = require('../ChronosActions');

describe('ChronosActions', function () {

  describe('#fetchJobs', function () {

    beforeEach(function () {
      spyOn(RequestUtil, 'json');
      ChronosActions.fetchJobs();
      this.configuration = RequestUtil.json.calls.mostRecent().args[0];
    });

    it('calls #json from the RequestUtil', function () {
      expect(RequestUtil.json).toHaveBeenCalled();
    });

    it('fetches data from the correct URL', function () {
      expect(this.configuration.url)
        .toEqual(`${Config.rootUrl}/chronos/jobs`);
    });

    it('dispatches the correct action when successful', function () {
      var id = AppDispatcher.register(function (payload) {
        var action = payload.action;
        AppDispatcher.unregister(id);
        expect(action.type).toEqual(ActionTypes.REQUEST_CHRONOS_JOBS_SUCCESS);
      });

      this.configuration.success([]);
    });

    it('dispatches the correct action when unsucessful', function () {
      var id = AppDispatcher.register(function (payload) {
        var action = payload.action;
        AppDispatcher.unregister(id);
        expect(action.type).toEqual(ActionTypes.REQUEST_CHRONOS_JOBS_ERROR);
      });

      this.configuration.error({message: 'error'});
    });

  });

  describe('#runJob', function () {

    beforeEach(function () {
      spyOn(RequestUtil, 'json');
      ChronosActions.runJob({foo: 'bar'});
      this.configuration = RequestUtil.json.calls.mostRecent().args[0];
    });

    it('calls #json from the RequestUtil', function () {
      expect(RequestUtil.json).toHaveBeenCalled();
    });

    it('POSTs data to the correct URL', function () {
      expect(this.configuration.url)
        .toEqual(`${Config.rootUrl}/chronos/jobs-runs`);
    });

    it('POSTs data with the correct method', function () {
      expect(this.configuration.method).toEqual('POST');
    });

    it('POSTs with the correct data', function () {
      expect(this.configuration.data).toEqual({foo: 'bar'});
    });

    it('dispatches the correct action when successful', function () {
      var id = AppDispatcher.register(function (payload) {
        var action = payload.action;
        AppDispatcher.unregister(id);

        expect(action.type)
          .toEqual(ActionTypes.REQUEST_CHRONOS_JOB_RUN_SUCCESS);
      });

      this.configuration.success([]);
    });

    it('dispatches the correct action when unsucessful', function () {
      var id = AppDispatcher.register(function (payload) {
        var action = payload.action;
        AppDispatcher.unregister(id);

        expect(action.type)
          .toEqual(ActionTypes.REQUEST_CHRONOS_JOB_RUN_ERROR);
      });

      this.configuration.error({message: 'error'});
    });

  });

});
