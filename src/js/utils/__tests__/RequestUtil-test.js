var $ = require("jquery");

jest.dontMock("../../config/Config");
jest.dontMock("../../utils/RequestUtil");

var Config = require("../../config/Config");
var RequestUtil = require("../../utils/RequestUtil");

describe("RequestUtil", function () {

  describe("#json", function () {

    beforeEach(function () {
      spyOn($, "ajax");
    });

    it("Should not make a request before called", function () {
      expect($.ajax).not.toHaveBeenCalled();
    });

    it("Should try to make a request even if no args are provided", function () {
      RequestUtil.json();
      expect($.ajax).toHaveBeenCalled();
      expect($.ajax.mostRecentCall.args[0].url).toEqual(null);
    });

    it("Should use defaults for a GET json request", function () {
      RequestUtil.json({url: "lol"});
      expect($.ajax).toHaveBeenCalled();
      expect($.ajax.mostRecentCall.args[0].url).toEqual("lol");
      expect($.ajax.mostRecentCall.args[0].contentType).toEqual("application/json; charset=utf-8");
      expect($.ajax.mostRecentCall.args[0].dataType).toEqual("json");
      expect($.ajax.mostRecentCall.args[0].timeout).toEqual(Config.stateRefresh);
      expect($.ajax.mostRecentCall.args[0].type).toEqual("GET");
    });

    it("Should override defaults with options given", function () {
      RequestUtil.json({type: "POST", contentType: "Yoghurt", dataType: "Bananas", timeout: 15});
      expect($.ajax).toHaveBeenCalled();
      expect($.ajax.mostRecentCall.args[0].contentType).toEqual("Yoghurt");
      expect($.ajax.mostRecentCall.args[0].dataType).toEqual("Bananas");
      expect($.ajax.mostRecentCall.args[0].timeout).toEqual(15);
      expect($.ajax.mostRecentCall.args[0].type).toEqual("POST");
    });

  });

  describe("#debounceOnError", function () {
    var successFn;
    var errorFn;

    beforeEach(function () {
      successFn = jest.genMockFunction();
      errorFn = jest.genMockFunction();

      spyOn($, "ajax").andCallFake(
        function (options) {
          // Trigger error for url "failRequest"
          if (/failRequest/.test(options.url)) {
            options.error();
          }

          // Trigger success for url "successRequest"
          if (/successRequest/.test(options.url)) {
            options.success();
          }
        }
      );

      this.request = RequestUtil.debounceOnError(
        10,
        function (resolve, reject) {
          return function (url) {
            RequestUtil.json({
              url: url,
              success: function () {
                successFn();
                resolve();
              },
              error: function () {
                errorFn();
                reject();
              }
            });
          };
        },
        {delayAfterCount: 4}
      );

    });

    it("should not debounce on the first 4 errors", function () {
      this.request("failRequest");
      this.request("failRequest");
      this.request("failRequest");
      this.request("failRequest");
      expect(errorFn.mock.calls.length).toEqual(4);
    });

    it("should debounce on more than 4 errors", function () {
      // These will all be called
      this.request("failRequest");
      this.request("failRequest");
      this.request("failRequest");
      this.request("failRequest");
      // These will all be debounced
      this.request("failRequest");
      this.request("failRequest");
      this.request("failRequest");
      expect(errorFn.mock.calls.length).toEqual(4);
    });

    it("should reset debouncing after success call", function () {
      // These will all be called
      this.request("failRequest");
      this.request("failRequest");
      this.request("failRequest");
      this.request("successRequest");
      this.request("failRequest");
      this.request("failRequest");
      this.request("failRequest");
      this.request("failRequest");
      // This will be debounced
      this.request("failRequest");
      this.request("failRequest");
      expect(errorFn.mock.calls.length).toEqual(7);
      expect(successFn.mock.calls.length).toEqual(1);
    });

  });

});
