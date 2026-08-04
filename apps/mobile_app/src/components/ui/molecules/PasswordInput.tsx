import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Input, InputProps } from '../atoms/Input';

export const PasswordInput: React.FC<InputProps> = (props) => {
  const [isSecure, setIsSecure] = useState(true);

  return (
    <Input
      secureTextEntry={isSecure}
      rightIcon={
        <TouchableOpacity onPress={() => setIsSecure(!isSecure)}>
          <Text className="text-xs font-semibold text-sky-600 dark:text-sky-400">
            {isSecure ? 'SHOW' : 'HIDE'}
          </Text>
        </TouchableOpacity>
      }
      {...props}
    />
  );
};
