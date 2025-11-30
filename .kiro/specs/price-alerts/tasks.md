# Implementation Plan

- [ ] 1. Set up database schema and migrations
  - Create alerts table with columns: id, user_id, symbol, condition_type, threshold_value, status, created_at, triggered_at
  - Create trigger_logs table with columns: id, alert_id, triggered_at, market_price, percentage_change, disclaimer
  - Add indexes on (user_id, status), (status, symbol), and (alert_id) for efficient queries
  - Write migration scripts for schema creation
  - _Requirements: 1.5, 3.3, 6.2_

- [ ] 2. Implement backend alert data models and types
  - Create TypeScript interfaces for Alert, TriggerLog, AlertConditionType enum, AlertStatus enum
  - Create DTOs for CreateAlertDto and MarketSnapshot
  - Implement data validation schemas using a validation library (e.g., Zod, Joi)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3. Implement Alert Service core functionality
  - [ ] 3.1 Implement alert creation with validation
    - Write createAlert method with symbol validation (non-empty, valid format)
    - Implement threshold value validation (must be positive)
    - Generate unique IDs and timestamps for new alerts
    - Set initial status to 'active'
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 3.2 Write property test for alert creation
    - **Property 1: Alert creation succeeds for all valid condition types**
    - **Validates: Requirements 1.1, 1.2, 1.5, 2.1, 2.2**
  
  - [ ]* 3.3 Write property test for invalid symbol rejection
    - **Property 2: Invalid symbols are rejected**
    - **Validates: Requirements 1.3**
  
  - [ ]* 3.4 Write property test for invalid threshold rejection
    - **Property 3: Invalid threshold values are rejected**
    - **Validates: Requirements 1.4, 2.3**

- [ ] 4. Implement alert retrieval and deletion
  - [ ] 4.1 Implement getAlertsByUser method
    - Query alerts by user_id
    - Join with trigger_logs for triggered alerts
    - Sort results with active alerts first, then triggered alerts
    - _Requirements: 4.1, 4.3, 4.4_
  
  - [ ] 4.2 Implement deleteAlert method
    - Verify user ownership before deletion
    - Delete alert from database
    - Preserve associated trigger logs (no cascade delete)
    - _Requirements: 6.1, 6.2_
  
  - [ ]* 4.3 Write property test for alert list completeness
    - **Property 7: Alert list contains complete information**
    - **Validates: Requirements 4.1, 4.3**
  
  - [ ]* 4.4 Write property test for alert list sorting
    - **Property 8: Alert list sorting is correct**
    - **Validates: Requirements 4.4**
  
  - [ ]* 4.5 Write property test for deletion behavior
    - **Property 9: Alert deletion removes alert but preserves logs**
    - **Validates: Requirements 6.1, 6.2**

- [ ] 5. Implement alert condition evaluation logic
  - [ ] 5.1 Implement percentage change calculation
    - Write function to calculate percentage change: ((current - previous) / previous) * 100
    - Handle edge cases (zero previous price)
    - _Requirements: 2.4_
  
  - [ ]* 5.2 Write property test for percentage calculation
    - **Property 4: Percentage change calculation is correct**
    - **Validates: Requirements 2.4**
  
  - [ ] 5.3 Implement evaluateCondition function
    - Implement logic for priceAbove condition
    - Implement logic for priceBelow condition
    - Implement logic for changePercentAbove condition
    - Implement logic for changePercentBelow condition
    - _Requirements: 3.2_
  
  - [ ]* 5.4 Write property test for condition evaluation
    - **Property 10: Condition evaluation is accurate**
    - **Validates: Requirements 3.2**

- [ ] 6. Implement alert triggering functionality
  - [ ] 6.1 Implement triggerAlert method
    - Update alert status from 'active' to 'triggered'
    - Set triggeredAt timestamp
    - Create trigger log with market data, timestamp, and disclaimer
    - Use database transaction to ensure atomicity
    - _Requirements: 3.2, 3.3, 3.4, 7.1_
  
  - [ ]* 6.2 Write property test for alert triggering
    - **Property 5: Alert triggering is complete and correct**
    - **Validates: Requirements 3.2, 3.3, 3.4, 7.1**

- [ ] 7. Implement Alert Checker background job
  - [ ] 7.1 Create alert checker service
    - Implement getActiveAlerts method to fetch all active alerts
    - Implement alert grouping by symbol for batch processing
    - Integrate with market data service for batch price fetching
    - _Requirements: 3.1, 8.1_
  
  - [ ] 7.2 Implement main evaluation loop
    - Fetch active alerts from database
    - Group alerts by symbol
    - Fetch market data in batches
    - Evaluate each alert's condition
    - Trigger alerts when conditions are met
    - Implement error handling to continue processing on individual failures
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [ ]* 7.3 Write property test for error resilience
    - **Property 6: Alert evaluation continues despite errors**
    - **Validates: Requirements 3.5**
  
  - [ ] 7.4 Set up job scheduler
    - Configure cron job or task scheduler to run every 60 seconds
    - Implement job execution logging
    - _Requirements: 3.1_

- [ ] 8. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement API endpoints
  - [ ] 9.1 Create POST /api/alerts endpoint
    - Accept CreateAlertDto in request body
    - Validate user authentication
    - Call alertService.createAlert
    - Return 201 with created alert or 400 with validation errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 9.2 Create GET /api/alerts endpoint
    - Validate user authentication
    - Call alertService.getAlertsByUser
    - Return 200 with alert list including trigger logs
    - _Requirements: 4.1, 4.3, 4.4_
  
  - [ ] 9.3 Create DELETE /api/alerts/:alertId endpoint
    - Validate user authentication and ownership
    - Call alertService.deleteAlert
    - Return 204 on success, 403 for unauthorized, 404 for not found
    - _Requirements: 6.1, 6.2_
  
  - [ ]* 9.4 Write integration tests for API endpoints
    - Test alert creation flow end-to-end
    - Test alert retrieval with various scenarios
    - Test alert deletion with ownership validation
    - Test error responses (401, 403, 404, 400)

- [ ] 10. Implement frontend Alert Form component
  - [ ] 10.1 Create AlertForm component structure
    - Create form state management (symbol, conditionType, thresholdValue, isSubmitting, error)
    - Implement controlled inputs for all fields
    - Add disclaimer display above or below form
    - _Requirements: 5.1, 5.2, 7.3_
  
  - [ ] 10.2 Implement form validation
    - Validate symbol is not empty
    - Validate threshold value is positive number
    - Display validation errors inline
    - _Requirements: 5.2_
  
  - [ ] 10.3 Implement form submission
    - Call POST /api/alerts on submit
    - Handle loading state during submission
    - Display success confirmation
    - Clear form on successful creation
    - Display error messages on failure
    - Trigger alert list refresh on success
    - _Requirements: 5.3, 5.4, 5.5_

- [ ] 11. Implement frontend Alert List components
  - [ ] 11.1 Create AlertCard component for active alerts
    - Display symbol, condition type, threshold value
    - Display creation timestamp
    - Add delete button with confirmation
    - _Requirements: 4.1_
  
  - [ ] 11.2 Create TriggeredAlertCard component
    - Display symbol, condition type, threshold value
    - Display trigger timestamp and market data values
    - Display disclaimer text prominently
    - Add delete button with confirmation
    - _Requirements: 4.1, 4.3, 7.2_
  
  - [ ] 11.3 Create AlertList component
    - Fetch alerts from GET /api/alerts on mount
    - Separate active and triggered alerts into sections
    - Render active alerts using AlertCard
    - Render triggered alerts using TriggeredAlertCard
    - Implement delete functionality calling DELETE endpoint
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 12. Create Alert Dashboard page
  - Compose AlertForm and AlertList components
  - Add DisclaimerBanner at top of page
  - Implement alert list refresh after creation
  - Add loading states and error boundaries
  - Style components according to UI mockup
  - _Requirements: 5.1, 7.2, 7.3_

- [ ] 13. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
