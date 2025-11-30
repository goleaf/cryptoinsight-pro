# Implementation Plan

- [ ] 1. Set up database schema and migrations
  - Create migration file for api_keys table with encrypted credential fields
  - Create migration file for connection_logs table for audit trail
  - Add indexes for user_id, status, and timestamps
  - Set up foreign key constraints and cascade deletion
  - Requirements: 1.5, 5.1, 5.2, 6.1

- [ ] 2. Implement encryption service
- [ ] 2.1 Create encryption service with AES-256-GCM
  - Implement encrypt() method with IV generation and authentication tag
  - Implement decrypt() method with authentication verification
  - Add key derivation using PBKDF2
  - Load master key from environment variable
  - Requirements: 1.5, 8.1, 8.2

- [ ]* 2.2 Write property test for encryption round-trip
  - Property 5: Encryption round-trip consistency
  - Validates: Requirements 1.5, 8.1, 8.2

- [ ]* 2.3 Write unit tests for encryption edge cases
  - Test with empty strings
  - Test with very long strings
  - Test IV uniqueness across multiple encryptions
  - Requirements: 1.5, 8.1, 8.2

- [ ] 3. Implement API key masking utility
- [ ] 3.1 Create masking function for API keys
  - Implement masking logic (first 4 + "..." + last 4 characters)
  - Handle edge cases for keys shorter than 8 characters
  - Requirements: 2.5

- [ ]* 3.2 Write property test for masking format
  - Property 10: API key masking format
  - Validates: Requirements 2.5

- [ ] 4. Create API keys repository
- [ ] 4.1 Implement repository with CRUD operations
  - Implement create() for storing encrypted credentials
  - Implement findByUserId() for listing user connections
  - Implement findById() for retrieving specific connection
  - Implement update() for modifying connection data
  - Implement delete() for removing connections
  - Implement logConnectionAttempt() for audit logging
  - Requirements: 1.3, 2.1, 3.1, 4.2, 5.1

- [ ]* 4.2 Write property test for deletion completeness
  - Property 17: Deletion completeness
  - Validates: Requirements 5.1, 5.2

- [ ]* 4.3 Write unit tests for repository operations
  - Test CRUD operations with sample data
  - Test query filtering by user ID
  - Test cascade deletion of related records
  - Requirements: 2.1, 5.1, 5.2

- [ ] 5. Implement exchange connector service
- [ ] 5.1 Create base exchange connector interface
  - Define interface for exchange-specific implementations
  - Create factory for instantiating exchange connectors
  - Requirements: 1.2, 9.1

- [ ] 5.2 Implement Binance connector
  - Implement testConnection() for Binance API
  - Implement getAccountInfo() for read-only data
  - Add read-only endpoint whitelist
  - Requirements: 1.2, 9.1, 9.2

- [ ] 5.3 Implement Coinbase Pro connector
  - Implement testConnection() for Coinbase API
  - Implement getAccountInfo() for read-only data
  - Add read-only endpoint whitelist
  - Requirements: 1.2, 9.1, 9.2

- [ ]* 5.4 Write property test for read-only enforcement
  - Property 20: Read-only endpoint restriction
  - Validates: Requirements 9.1

- [ ]* 5.5 Write property test for trading permission detection
  - Property 21: Trading permission detection
  - Validates: Requirements 9.2, 9.3

- [ ] 6. Implement API key management service
- [ ] 6.1 Create service with validation and orchestration logic
  - Implement createConnection() with format validation and connectivity test
  - Implement listConnections() with credential masking
  - Implement getConnection() with authorization checks
  - Implement updateConnection() with connectivity test and preservation of metadata
  - Implement updateConnectionStatus() for enable/disable
  - Implement deleteConnection() with complete removal
  - Implement testConnection() for on-demand testing
  - Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.1

- [ ]* 6.2 Write property test for format validation precedes storage
  - Property 1: Format validation precedes storage
  - Validates: Requirements 1.1

- [ ]* 6.3 Write property test for connectivity testing precedes storage
  - Property 2: Connectivity testing precedes storage
  - Validates: Requirements 1.2

- [ ]* 6.4 Write property test for successful connectivity enables storage
  - Property 3: Successful connectivity enables storage
  - Validates: Requirements 1.3

- [ ]* 6.5 Write property test for failed connectivity prevents storage
  - Property 4: Failed connectivity prevents storage
  - Validates: Requirements 1.4

- [ ]* 6.6 Write property test for stored credentials are encrypted
  - Property 6: Stored credentials are encrypted
  - Validates: Requirements 1.5, 8.1, 8.2

- [ ]* 6.7 Write property test for list completeness
  - Property 7: List completeness
  - Validates: Requirements 2.1

- [ ]* 6.8 Write property test for response credential exclusion
  - Property 8: Response credential exclusion
  - Validates: Requirements 2.2

- [ ]* 6.9 Write property test for response field completeness
  - Property 9: Response field completeness
  - Validates: Requirements 2.3, 2.4, 2.5

- [ ]* 6.10 Write property test for status transition consistency
  - Property 11: Status transition consistency
  - Validates: Requirements 3.1, 3.2

- [ ]* 6.11 Write property test for status-based filtering
  - Property 12: Status-based filtering
  - Validates: Requirements 3.3, 3.4

- [ ]* 6.12 Write property test for update requires connectivity test
  - Property 13: Update requires connectivity test
  - Validates: Requirements 4.1

- [ ]* 6.13 Write property test for successful update replaces credentials
  - Property 14: Successful update replaces credentials
  - Validates: Requirements 4.2

- [ ]* 6.14 Write property test for failed update preserves original
  - Property 15: Failed update preserves original
  - Validates: Requirements 4.3

- [ ]* 6.15 Write property test for update preserves metadata invariants
  - Property 16: Update preserves metadata invariants
  - Validates: Requirements 4.4

- [ ]* 6.16 Write property test for deletion irreversibility
  - Property 18: Deletion irreversibility
  - Validates: Requirements 5.3

- [ ]* 6.17 Write property test for credential exclusion from system outputs
  - Property 19: Credential exclusion from system outputs
  - Validates: Requirements 6.1, 6.2, 6.3

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement API key controller
- [ ] 8.1 Create REST endpoints for API key management
  - Implement POST /api/v1/api-keys for creating connections
  - Implement GET /api/v1/api-keys for listing connections
  - Implement GET /api/v1/api-keys/:id for getting specific connection
  - Implement PUT /api/v1/api-keys/:id for updating credentials
  - Implement PATCH /api/v1/api-keys/:id/status for enable/disable
  - Implement DELETE /api/v1/api-keys/:id for removing connections
  - Implement POST /api/v1/api-keys/:id/test for testing connectivity
  - Add request validation middleware
  - Add authentication middleware
  - Add authorization middleware (user can only access own keys)
  - Requirements: 1.1, 1.2, 2.1, 3.1, 3.2, 4.1, 5.1

- [ ] 8.2 Implement error handling and response formatting
  - Create error response formatter
  - Implement validation error handling (400)
  - Implement authentication error handling (401)
  - Implement authorization error handling (403)
  - Implement not found error handling (404)
  - Implement connectivity error handling (422)
  - Implement server error handling (500)
  - Ensure no credentials in error messages
  - Requirements: 6.2

- [ ]* 8.3 Write unit tests for controller endpoints
  - Test request validation
  - Test authorization checks
  - Test error response formatting
  - Requirements: 1.1, 2.1, 3.1, 4.1, 5.1

- [ ] 9. Create frontend settings page structure
- [ ] 9.1 Implement settings page layout
  - Create SettingsPage component with layout
  - Add routing for /settings/api-keys
  - Integrate with authentication context
  - Requirements: 7.1

- [ ] 9.2 Implement security disclaimer component
  - Create SecurityDisclaimer component with warning messages
  - Display user responsibility notice
  - Display read-only permission guidance
  - Requirements: 7.1, 7.2, 7.3

- [ ] 10. Implement connected exchanges list
- [ ] 10.1 Create connection list component
  - Implement ConnectedExchangesList component
  - Add empty state for no connections
  - Fetch connections from API on mount
  - Requirements: 2.1, 2.2, 2.3, 2.4, 2.5

- [ ] 10.2 Create connection card component
  - Implement ConnectionCard component with connection details
  - Display masked API key
  - Display status badge
  - Display last tested and last sync timestamps
  - Add action buttons (test, enable/disable, remove)
  - Requirements: 2.2, 2.3, 2.4, 2.5

- [ ] 10.3 Implement connection actions
  - Implement test connection handler
  - Implement toggle status handler
  - Implement delete connection handler with confirmation
  - Add loading states for async operations
  - Add error handling and user feedback
  - Requirements: 3.1, 3.2, 5.1

- [ ] 11. Implement add connection form
- [ ] 11.1 Create add connection form component
  - Implement AddConnectionForm component
  - Add form fields (exchange, apiKey, apiSecret, label)
  - Add form validation
  - Implement form submission with API call
  - Add loading state during connectivity test
  - Requirements: 1.1, 1.2, 1.3, 1.4

- [ ] 11.2 Create read-only warning component
  - Implement ReadOnlyWarning component
  - Display security warnings about read-only keys
  - Add expandable instructions for creating read-only keys
  - Requirements: 7.2, 7.3

- [ ] 11.3 Create exchange-specific instructions component
  - Implement ExchangeInstructions component
  - Add instructions for Binance
  - Add instructions for Coinbase Pro
  - Add instructions for Kraken
  - Add instructions for Bitfinex
  - Include links to exchange API management pages
  - Requirements: 7.3

- [ ] 12. Add styling and polish
- [ ] 12.1 Style settings page components
  - Add CSS for settings page layout
  - Style security disclaimer with warning colors
  - Style connection cards with status indicators
  - Style add connection form
  - Add responsive design for mobile devices
  - Requirements: 7.1

- [ ] 12.2 Add loading and error states
  - Implement loading spinners for async operations
  - Add error message displays
  - Add success notifications
  - Implement retry mechanisms for failed operations
  - Requirements: 1.4, 4.3

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Add additional exchange support
- [ ] 14.1 Implement Kraken connector
  - Implement testConnection() for Kraken API
  - Implement getAccountInfo() for read-only data
  - Add read-only endpoint whitelist
  - Requirements: 1.2, 9.1, 9.2

- [ ] 14.2 Implement Bitfinex connector
  - Implement testConnection() for Bitfinex API
  - Implement getAccountInfo() for read-only data
  - Add read-only endpoint whitelist
  - Requirements: 1.2, 9.1, 9.2

- [ ] 15. Implement audit logging
- [ ] 15.1 Add connection attempt logging
  - Log all connection creation attempts
  - Log all connection test attempts
  - Log all connection updates
  - Log all connection deletions
  - Include operation type, success/failure, timestamp
  - Ensure no credentials in logs
  - Requirements: 6.1

- [ ] 15.2 Create audit log viewer (optional)
  - Create admin interface for viewing connection logs
  - Add filtering by user, operation, date range
  - Display operation history for debugging
  - Requirements: 6.1

- [ ] 16. Add environment configuration
- [ ] 16.1 Set up environment variables
  - Add ENCRYPTION_MASTER_KEY to environment
  - Add DATABASE_URL configuration
  - Add API_RATE_LIMIT_PER_MINUTE configuration
  - Add EXCHANGE_API_TIMEOUT_MS configuration
  - Create .env.example file with documentation
  - Requirements: 1.5, 8.1, 8.2

- [ ] 16.2 Add configuration validation
  - Validate encryption key is present and correct length
  - Validate database connection on startup
  - Validate exchange API credentials format
  - Requirements: 1.1, 1.5

- [ ] 17. Documentation and deployment preparation
- [ ] 17.1 Create API documentation
  - Document all REST endpoints with examples
  - Document request/response formats
  - Document error codes and messages
  - Create Postman/OpenAPI collection
  - Requirements: All

- [ ] 17.2 Create user documentation
  - Write guide for adding exchange API keys
  - Document security best practices
  - Create troubleshooting guide
  - Requirements: 7.1, 7.2, 7.3
