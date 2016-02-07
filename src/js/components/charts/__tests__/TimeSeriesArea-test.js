var _ = require('underscore');
var d3 = require('d3');
var React = require('react');
var TestUtils = require('react-addons-test-utils');

jest.dontMock('./fixtures/MockTimeSeriesData');
jest.dontMock('../../../mixins/ChartMixin');
jest.dontMock('../TimeSeriesChart');
jest.dontMock('../TimeSeriesArea');

var MockTimeSeriesData = require('./fixtures/MockTimeSeriesData');
var TimeSeriesArea = require('../TimeSeriesArea');

function checkPath(instance, props) {
  var area = TestUtils.findRenderedDOMComponentWithClass(
    instance, 'area'
  );

  var index = 1;
  var points = area.getDOMNode().attributes.d.value.split(',');
  _.each(points, function (str, i) {
    // Disgard values after we've been through data
    // Also parseFloat and check with index (int) to make sure we exactly
    // where we want to be
    if (index < props.values.length && parseFloat(str) === index) {

      // Pick out the value we need
      var value = Math.round(parseFloat(points[i + 1].split('S')));
      expect(value).toEqual(props.values[index].y);
      index++;
    }
  });
}

describe('TimeSeriesArea', function () {

  beforeEach(function () {
    this.props = {
      values: MockTimeSeriesData.firstSet
    };

    this.areaDef = d3.svg.area()
      .x(function (d) { return d.date; })
      .y0(function () { return 0; })
      .y1(function (d) { return d.y; })
      .interpolate('monotone');
    this.area = this.areaDef(this.props.values);

    this.valueLineDef = d3.svg.line()
      .x(function (d) { return d.date; })
      .y(function (d) { return d.y; })
      .interpolate('monotone');
    this.valueLine = this.valueLineDef(this.props.values);

    this.instance = TestUtils.renderIntoDocument(
      <TimeSeriesArea
        line={this.valueLine}
        path={this.area}
        position={[-10, 0]}
        transitionTime={10} />
    );

  });

  it('should render a path according to first data set', function () {
    checkPath(this.instance, this.props);
  });

  it('should render a path according to second data set', function () {
    this.props.values = MockTimeSeriesData.secondSet;
    var area = this.areaDef(this.props.values);
    var valueLine = this.valueLineDef(this.props.values);

    this.instance = TestUtils.renderIntoDocument(
      <TimeSeriesArea
        line={valueLine}
        path={area}
        position={[-10, 0]}
        transitionTime={10} />
    );

    checkPath(this.instance, this.props);
  });

  it('should check that the path is correctly updated', function () {
    checkPath(this.instance, this.props);
    this.props.values = MockTimeSeriesData.secondSet;
    var area = this.areaDef(this.props.values);
    var valueLine = this.valueLineDef(this.props.values);

    var props = {
      line: valueLine,
      path: area,
      position: [-10, 0],
      transitionTime: 10
    };
    this.instance.setProps(props);

    checkPath(this.instance, this.props);
  });

});
