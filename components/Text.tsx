import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { forwardRef } from 'react';

interface CustomTextProps extends TextProps {
  medium?: boolean;
  bold?: boolean;
}

const Text = forwardRef<RNText, CustomTextProps>(({ style, medium, bold, ...props }, ref) => {
  return (
    <RNText
      ref={ref}
      style={[
        styles.default,
        medium && styles.medium,
        bold && styles.bold,
        style,
      ]}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  default: {
    fontFamily: 'Ubuntu-Regular',
  },
  medium: {
    fontFamily: 'Ubuntu-Medium',
  },
  bold: {
    fontFamily: 'Ubuntu-Bold',
  },
});

export default Text; 