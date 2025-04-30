import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { Page, QnAConfig } from '@presentx/shared';

interface QnAViewerProps {
  page: Page;
  onSubmit: (responseData: any) => void; // For submitting questions
  isLoading: boolean;
}

const QnAViewer: React.FC<QnAViewerProps> = ({ page, onSubmit, isLoading }) => {
  const config = page.page_config as QnAConfig;

  // Q&A is more complex, involving potentially submitting questions
  // and displaying a list of submitted/upvoted questions from the summary/socket events

  return (
    <View style={styles.container}>
      <Title>{page.page_title || 'Q&A'}</Title>
      <Paragraph style={styles.question}>Submit your questions below:</Paragraph>
      <Text style={styles.placeholder}>[Question input and submit button will go here]</Text>
      <Text style={styles.placeholder}>[List of submitted questions (from socket events) will go here]</Text>
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

export default QnAViewer; 