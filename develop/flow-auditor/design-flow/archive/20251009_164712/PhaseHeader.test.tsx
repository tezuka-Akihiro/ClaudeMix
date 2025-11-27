import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { loadSpecData, getTestData } from '~/test/utils/spec-loader.js';
import {{COMPONENT_NAME}} from '~/{{COMPONENT_PATH}}';

describe('{{COMPONENT_NAME}} Component', () => {
  let specData;

  beforeAll(() => {
    // Load spec data for UI elements and test data
    specData = loadSpecData('{{SPEC_FILE_NAME}}.yaml');
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      // Arrange: Get test data from spec
      const testData = getTestData(specData, 'test_data.valid.{{DATA_PATH}}');

      // Act
      render(<{{COMPONENT_NAME}} {...testData} />);

      // Assert: Check basic rendering
      expect(screen.getByRole('{{ROLE_TYPE}}')).toBeInTheDocument();
    });

    it('should display correct content', () => {
      // Arrange: Get content data
      const contentData = getTestData(specData, 'test_data.valid.input_data');

      // Act
      render(<{{COMPONENT_NAME}} data={contentData} />);

      // Assert: Check content display
      if (contentData.title) {
        expect(screen.getByText(contentData.title)).toBeInTheDocument();
      }
    });
  });

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      // Arrange: Get UI selector from spec
      const buttonSelector = getTestData(specData, 'ui_elements.form.submit_button');
      const testData = getTestData(specData, 'test_data.valid.input_data');

      // Act
      render(<{{COMPONENT_NAME}} {...testData} />);
      const button = screen.getByTestId('{{BUTTON_TEST_ID}}');
      fireEvent.click(button);

      // Assert
      await waitFor(() => {
        // TODO: Add specific interaction assertions
        expect(button).toBeInTheDocument();
      });
    });

    it('should handle form input', () => {
      // Arrange: Get form selectors
      const inputSelector = getTestData(specData, 'ui_elements.form.title_input');
      const testValue = getTestData(specData, 'test_data.valid.input_data.title');

      // Act
      render(<{{COMPONENT_NAME}} />);
      const input = screen.getByTestId('{{INPUT_TEST_ID}}');
      fireEvent.change(input, { target: { value: testValue } });

      // Assert
      expect(input.value).toBe(testValue);
    });
  });

  describe('Error States', () => {
    it('should display validation errors', () => {
      // Arrange: Get error messages from spec
      const errorMessage = getTestData(specData, 'validation.error_messages.{{FIELD_NAME}}.required');
      const invalidData = getTestData(specData, 'test_data.invalid.empty_fields');

      // Act
      render(<{{COMPONENT_NAME}} data={invalidData} showErrors={true} />);

      // Assert: Check error display
      if (errorMessage) {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      }
    });

    it('should handle loading states', () => {
      // Arrange: Get loading selector
      const loadingSelector = getTestData(specData, 'ui_elements.loading.spinner');

      // Act
      render(<{{COMPONENT_NAME}} loading={true} />);

      // Assert
      expect(screen.getByTestId('{{LOADING_TEST_ID}}')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      // Act
      render(<{{COMPONENT_NAME}} />);

      // Assert: Check accessibility
      const component = screen.getByRole('{{ROLE_TYPE}}');
      expect(component).toHaveAttribute('aria-label');
    });
  });
});