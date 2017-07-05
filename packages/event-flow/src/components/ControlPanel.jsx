import { css, StyleSheet } from 'aphrodite';
import React from 'react';
import PropTypes from 'prop-types';

import { Button, Select, StepIncrementer } from '@data-ui/forms';

import EventTypeLegend from './EventTypeLegend';
import EventTypeRadialChart from './EventTypeRadialChart';

import { scaleShape, xScaleTypeShape } from '../propShapes';
import formatIncrementerValue from '../utils/formatIncrementerValue';
import { fontFamily } from '../theme';

import {
  ANY_EVENT_TYPE,
  ELAPSED_TIME_SCALE,
  EVENT_SEQUENCE_SCALE,
  FILTERED_EVENTS,
  ORDER_BY_EVENT_COUNT,
  ORDER_BY_ELAPSED_MS,
} from '../constants';

export const width = 300;

const unit = 8;
const padding = 3 * unit;
const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    fontFamily,
    fontSize: 12,
    fontColor: '#767676',
    width: `calc(100% - ${padding}px)`,
    height: '100%',
    padding,
    background: '#fff',
  },

  innerContainer: {
    overflowY: 'auto',
  },

  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },

  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
  },

  alignBySelect: {
    paddingLeft: 1 * unit,
    fontWeight: 700,
    flexGrow: 1,
  },

  header: {
    position: 'absolute',
    top: 0,
    right: '100%',
    textAlign: 'right',
  },

  input: {
    paddingBottom: 3 * unit,
  },

  option: {
    display: 'flex',
    alignItems: 'center',
  },

  optionLegend: {
    flexShrink: 0,
    color: 'inherit',
    background: 'currentColor',
    width: 12,
    height: 12,
    borderRadius: '50%',
    marginRight: 8,
  },

  title: {
    fontWeight: 700,
    fontSize: 14,
  },
});

const propTypes = {
  alignByIndex: PropTypes.number.isRequired,
  alignByEventType: PropTypes.string.isRequired,
  orderBy: PropTypes.string.isRequired,
  colorScale: scaleShape.isRequired,
  xScaleType: xScaleTypeShape.isRequired,
  onChangeXScale: PropTypes.func,
  onToggleShowControls: PropTypes.func,
  onChangeAlignByIndex: PropTypes.func,
  onChangeAlignByEventType: PropTypes.func,
  onChangeOrderBy: PropTypes.func,
  showControls: PropTypes.bool.isRequired,
  metaData: PropTypes.object,
};

const defaultProps = {
  onChangeXScale: () => {},
  onChangeYScale: () => {},
  onToggleShowControls: () => {},
  onChangeAlignByIndex: () => {},
  onChangeAlignByEventType: () => {},
  onChangeOrderBy: () => {},
  metaData: {},
};

function ControlPanel({
  showControls,
  alignByIndex,
  alignByEventType,
  orderBy,
  xScaleType,
  colorScale,
  onToggleShowControls,
  onChangeAlignByEventType,
  onChangeAlignByIndex,
  onChangeXScale,
  onChangeOrderBy,
  metaData,
}) {
  const eventTypeOptions = [
    { value: ANY_EVENT_TYPE, label: 'event' },
    ...colorScale.scale.domain().map(value => ({ value, label: value })),
  ];

  // Sort the scale by count
  const eventTypeScale = colorScale.scale.copy();
  eventTypeScale.domain(eventTypeScale.domain().sort((a, b) => (
    (metaData.countLookup[b] || 0) - (metaData.countLookup[a] || 0)
  )));
  eventTypeScale.range(eventTypeScale.domain().map(eventType => colorScale.scale(eventType)));

  // option renderer
  const valueRenderer = (option) => {
    if (option.value === ANY_EVENT_TYPE) return option.label;
    const color = colorScale.scale(option.value);
    return (
      <div className={css(styles.option)} style={{ color }}>
        <div className={css(styles.optionLegend)} />
        {option.label}
      </div>
    );
  };

  return (
    <div className={css(styles.outerContainer)}>

      <div className={css(styles.header)}>
        <Button onClick={onToggleShowControls}>
          {showControls
            ? <span>{'Hide >'}</span>
            : <span>{'< Controls'}</span>}
        </Button>
      </div>

      {showControls &&
        <div className={css(styles.innerContainer)}>
          <div className={css(styles.input)}>
            <div className={css(styles.title)}>
              X-axis
            </div>
            <Select
              value={xScaleType}
              options={[
                { label: 'Elapsed time', value: ELAPSED_TIME_SCALE },
                { label: 'Event sequence', value: EVENT_SEQUENCE_SCALE },
              ]}
              onChange={({ value }) => onChangeXScale(value)}
            />
          </div>

          <div className={css(styles.input)}>
            <div className={css(styles.title)}>
              Align sequences by
            </div>
            <div className={css(styles.flexRow)}>
              <StepIncrementer
                min={-5}
                max={5}
                value={alignByIndex}
                onChange={onChangeAlignByIndex}
                formatValue={formatIncrementerValue}
                disableZero
              />
              <div className={css(styles.alignBySelect)}>
                <Select
                  value={alignByEventType}
                  options={eventTypeOptions.filter(opt => opt.value !== FILTERED_EVENTS)}
                  optionRenderer={valueRenderer}
                  valueRenderer={valueRenderer}
                  onChange={({ value }) => onChangeAlignByEventType(value)}
                />
              </div>
            </div>
          </div>

          <div className={css(styles.input)}>
            <div className={css(styles.title)}>
              Sort nodes with the same parent by
            </div>
            <Select
              value={orderBy}
              options={[
                { label: 'Event count', value: ORDER_BY_EVENT_COUNT },
                { label: 'Time to next event', value: ORDER_BY_ELAPSED_MS },
              ]}
              onChange={({ value }) => onChangeOrderBy(value)}
            />
          </div>

          <div className={css(styles.flexColumn)}>
            <div className={css(styles.title)}>
              {`Event type summary (n = ${metaData.countTotal})`}
            </div>
            <div className={css(styles.flexColumn)}>
              <EventTypeRadialChart
                data={metaData.countArray}
                width={0.7 * width}
                height={0.7 * width}
                colorScale={eventTypeScale}
              />
              <EventTypeLegend
                scale={eventTypeScale}
                labelFormat={(label) => {
                  const count = metaData.countLookup[label];
                  const percentage = (count / metaData.countTotal) * 100;
                  const text = label === FILTERED_EVENTS ? 'filtered' : label;
                  return !isNaN(percentage) ? `${text} (${percentage.toFixed(1)}%)` : text;
                }}
              />
            </div>
          </div>

        </div>}
    </div>
  );
}

ControlPanel.propTypes = propTypes;
ControlPanel.defaultProps = defaultProps;

export default ControlPanel;
