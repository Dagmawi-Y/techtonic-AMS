import { TextInput as RNTextInput, TextInputProps, StyleSheet } from 'react-native';
import { forwardRef } from 'react';

const TextInput = forwardRef<RNTextInput, TextInputProps>((props, ref) => {
  const { style, ...otherProps } = props;

  return (
    <RNTextInput
      ref={ref}
      style={[styles.default, style]}
      {...otherProps}
    />
  );
});

const styles = StyleSheet.create({
  default: {
    fontFamily: 'Ubuntu-Regular',
  },
});

export default TextInput; 