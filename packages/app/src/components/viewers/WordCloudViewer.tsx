import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { Page, WordCloudConfig } from '@presentx/shared';

interface WordCloudViewerProps {
  page: Page;
  onSubmit: (responseData: any) => void;
  isLoading: boolean;
}

const WordCloudViewer: React.FC<WordCloudViewerProps> = ({ page, onSubmit, isLoading }) => {
  const config = page.page_config as WordCloudConfig;

  return (
    <View style={styles.container}>
      <Title>{page.page_title || 'Word Cloud Input'}</Title>
      <Paragraph style={styles.question}>{config.question}</Paragraph>
      <Text style={styles.placeholder}>[Text input and submit button will go here]</Text>
      <Text style={styles.placeholder}>[Word cloud display based on summary will also go here]</Text>
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
  placeholder: {
      fontStyle: 'italic',
      color: 'grey',
      textAlign: 'center',
      marginVertical: 10,
  }
});

export default WordCloudViewer; 