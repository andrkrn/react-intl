import * as React from 'react';
import {invariantIntlContext} from '../utils';
import {IntlShape, FormatDateOptions, FormatNumberOptions} from '../types';
import {Context} from './injectIntl';
import {getFormatter as getDateTimeFormatter} from '../formatters/dateTime';
import {getFormatter as getNumberFormatter} from '../formatters/number';
// Since rollup cannot deal with namespace being a function,
// this is to interop with TypeScript since `invariant`
// does not export a default
// https://github.com/rollup/rollup/issues/1267
import * as invariant_ from 'invariant';
const invariant: typeof invariant_ = (invariant_ as any).default || invariant_;

enum DisplayName {
  formatDate = 'FormattedDate',
  formatTime = 'FormattedTime',
  formatNumber = 'FormattedNumber',
}

type Formatter = {
  formatDate: FormatDateOptions;
  formatTime: FormatDateOptions;
  formatNumber: FormatNumberOptions;
};

export default function createFormattedComponent<Name extends keyof Formatter>(
  name: Name
) {
  type FormatFn = IntlShape[Name];
  type Props = Formatter[Name] & {
    shouldFormatToParts?: boolean;
    value: Parameters<FormatFn>[0];
    children?:
      | ((val: string) => React.ReactElement | null)
      | ((val: Intl.DateTimeFormatPart[]) => React.ReactElement | null)
      | ((val: Intl.NumberFormatPart[]) => React.ReactElement | null);
  };

  const Component: React.FC<Props> = props => (
    <Context.Consumer>
      {intl => {
        invariantIntlContext(intl);
        let formattedParts;
        const {value, shouldFormatToParts, children} = props;
        if (shouldFormatToParts) {
          if (name === 'formatDate') {
            const date =
              typeof value === 'string' ? new Date(value || 0) : value;
            formattedParts = getDateTimeFormatter(
              intl,
              'date',
              intl.formatters.getDateTimeFormat,
              props
            ).formatToParts(date as any);
          } else if (name === 'formatTime') {
            const date =
              typeof value === 'string' ? new Date(value || 0) : value;
            formattedParts = getDateTimeFormatter(
              intl,
              'time',
              intl.formatters.getDateTimeFormat,
              props
            ).formatToParts(date as any);
          } else {
            formattedParts = getNumberFormatter(
              intl,
              intl.formatters.getNumberFormat,
              props
            ).formatToParts(value as number);
          }
          invariant(
            typeof children === 'function',
            'render props must be a function when `shouldFormatToParts` is `true`'
          );
          return children!(formattedParts as any);
        }
        const formattedValue = intl[name](value as any, props);

        if (typeof children === 'function') {
          return children(formattedValue as any);
        }
        const Text = intl.textComponent || React.Fragment;
        return <Text>{formattedValue}</Text>;
      }}
    </Context.Consumer>
  );
  Component.displayName = DisplayName[name];
  return Component;
}
