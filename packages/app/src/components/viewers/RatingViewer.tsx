import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { Page, RatingConfig } from '@presentx/shared';

interface RatingViewerProps {
  page: Page;
  onSubmit: (responseData: number) => void; // Response is the selected number
  isLoading: boolean;
}

const RatingViewer: React.FC<RatingViewerProps> = ({
  page,
  onSubmit,
  isLoading,
}) => {
  const config = page.page_config as RatingConfig;
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const theme = useTheme();

  const handleSelect = (value: number) => {
    setSelectedValue(value);
    // Submit immediately on selection
    onSubmit(value);
  };

  const ratings = Array.from({ length: config.scale }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Title>{page.page_title || 'Rating'}</Title>
      <Paragraph style={styles.question}>{config.question}</Paragraph>

      <View style={styles.ratingContainer}>
        {ratings.map((ratingValue) => (
          <Button
            key={ratingValue}
            mode={selectedValue === ratingValue ? 'contained' : 'outlined'}
            onPress={() => handleSelect(ratingValue)}
            disabled={isLoading}
            style={styles.ratingButton}
            labelStyle={selectedValue === ratingValue ? styles.selectedLabel : {}}
          >
            {String(ratingValue)}
          </Button>
        ))}
      </View>

      {config.label_low && config.label_high && (
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>{config.label_low}</Text>
          <Text style={styles.labelText}>{config.label_high}</Text>
        </View>
      )}

      {isLoading && selectedValue && (
          <ActivityIndicator animating={true} size="small" style={styles.activityIndicator} />
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  question: {
    marginBottom: 24,
    fontSize: 16,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  ratingButton: {
    minWidth: 40, // Ensure buttons have some width
  },
  selectedLabel: {
      // Add styles for selected button text if needed (e.g., white color if button is contained)
      // color: 'white' // Example
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10, // Adjust as needed
    marginTop: 8,
  },
  labelText: {
    fontSize: 12,
    color: 'grey',
  },
  activityIndicator: {
      marginTop: 16,
  }
});

export default RatingViewer; 