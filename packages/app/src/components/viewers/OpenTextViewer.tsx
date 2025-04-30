import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  TextInput,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { Page, OpenTextConfig } from '@presentx/shared';

interface OpenTextViewerProps {
  page: Page;
  onSubmit: (responseData: string) => void; // Response is the entered text
  isLoading: boolean;
}

const OpenTextViewer: React.FC<OpenTextViewerProps> = ({
  page,
  onSubmit,
  isLoading,
}) => {
  const config = page.page_config as OpenTextConfig;
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      // Optional: Clear text after submit?
      // setText('');
    }
  };

  return (
    <View style={styles.container}>
      <Title>{page.page_title || 'Open Text'}</Title>
      <Paragraph style={styles.question}>{config.question}</Paragraph>

      <TextInput
        label="Your response"
        value={text}
        onChangeText={setText}
        mode="outlined"
        multiline
        numberOfLines={4} // Adjust as needed
        maxLength={config.max_length} // Use max_length from config
        style={styles.input}
        disabled={isLoading}
      />

      {isLoading ? (
        <ActivityIndicator animating={true} size="small" style={styles.submitButton} />
      ) : (
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={!text.trim() || isLoading}
          style={styles.submitButton}
        >
          Submit
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  question: {
    marginBottom: 16,
    fontSize: 16,
  },
  input: {
      marginBottom: 16,
  },
  submitButton: {
      marginTop: 8,
  }
});

export default OpenTextViewer; 