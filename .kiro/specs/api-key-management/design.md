# Design Document: API Key Management System

## Overview

The API Key Management System provides secure storage and management of cryptocurrency exchange API credentials. The system enables users to connect multiple exchange accounts for read-only data access while maintaining strict security controls through encryption at rest, secure key handling, and validation mechanisms.

The architecture follows a layered approach with clear separation between data storage, business logic, and presentation layers. Security is enforced at multiple levels including encryption, access control, and operational constraints that prevent trading operations.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Settings   │  │  Connection  │  │   Security   │      │
│  │     Page     │  │     Form     │  │   Warnings   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Backend Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Key Controller                      │   │
│  │  (Authentication, Authorization, Request Validation) │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           API Key Management Service                 │   │
│  │  • CRUD Operations    • Validation                   │   │
│  │  • Encryption/Decrypt • Connectivity Testing         │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Encryption Service                      │   │
│  │  • AES-256-GCM Encryption                            │   │
│  │  • Key Derivation (PBKDF2)                           │   │
│  │  • Secure Key Storage                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Exchange Connector Service                   │   │
│  │  • Exchange API Clients                              │   │
│  │  • Connectivity Testing                              │   │
│  │  • Read-Only Enforcement                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Keys Repository                     │   │
│  │  (Database Access, Query Building)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Database                           │   │
│  │  • api_keys table (encrypted credentials)            │   │
│  │  • connection_logs table (audit trail)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Security Architecture

The system implements defense-in-depth security:

1. **Transport Security**: All API communications use HTTPS/TLS
2. **Authentication**: User authentication required for all operations
3. **Authorization**: Users can only access their own API keys
4. **Encryption at Rest**: AES-256-GCM encryption for stored credentials
5. **Memory Security**: Decrypted keys exist only in memory during use
6. **Audit Logging**: All operations logged (without sensitive data)
7. **Read-Only Enforcement**: Only safe endpoints are invoked

## Components and Interfaces

### 1. API Key Controller

**Responsibilities:**
- Handle HTTP requests for API key management
- Validate request payloads
- Enforce authentication and authorization
- Return appropriate HTTP responses

**Endpoints:**

```typescript
POST   /api/v1/api-keys              // Create new API key connection
GET    /api/v1/api-keys              // List all user's connections
GET    /api/v1/api-keys/:id          // Get specific connection details
PUT    /api/v1/api-keys/:id          // Update API key credentials
PATCH  /api/v1/api-keys/:id/status   // Enable/disable connection
DELETE /api/v1/api-keys/:id          // Remove connection
POST   /api/v1/api-keys/:id/test     // Test connectivity
```

**Request/Response Examples:**

```typescript
// POST /api/v1/api-keys
Request: {
  exchange: "binance",
  apiKey: "abc123...",
  apiSecret: "xyz789...",
  label: "My Binance Account"
}

Response: {
  id: "uuid",
  exchange: "binance",
  label: "My Binance Account",
  maskedKey: "abc1...3xyz",
  status: "enabled",
  createdAt: "2025-12-01T10:00:00Z",
  lastTestedAt: "2025-12-01T10:00:00Z"
}

// GET /api/v1/api-keys
Response: {
  connections: [
    {
      id: "uuid",
      exchange: "binance",
      label: "My Binance Account",
      maskedKey: "abc1...3xyz",
      status: "enabled",
      createdAt: "2025-12-01T10:00:00Z",
      lastTestedAt: "2025-12-01T10:00:00Z",
      lastSyncAt: "2025-12-01T12:00:00Z"
    }
  ]
}
```

### 2. API Key Management Service

**Responsibilities:**
- Orchestrate API key lifecycle operations
- Coordinate encryption/decryption
- Validate API key format and connectivity
- Manage connection status

**Interface:**

```typescript
interface ApiKeyManagementService {
  createConnection(
    userId: string,
    exchange: string,
    apiKey: string,
    apiSecret: string,
    label?: string
  ): Promise<ApiKeyConnection>;
  
  listConnections(userId: string): Promise<ApiKeyConnection[]>;
  
  getConnection(userId: string, connectionId: string): Promise<ApiKeyConnection>;
  
  updateConnection(
    userId: string,
    connectionId: string,
    apiKey: string,
    apiSecret: string
  ): Promise<ApiKeyConnection>;
  
  updateConnectionStatus(
    userId: string,
    connectionId: string,
    enabled: boolean
  ): Promise<ApiKeyConnection>;
  
  deleteConnection(userId: string, connectionId: string): Promise<void>;
  
  testConnection(userId: string, connectionId: string): Promise<ConnectionTestResult>;
}
```

### 3. Encryption Service

**Responsibilities:**
- Encrypt API keys and secrets before storage
- Decrypt credentials for use
- Manage encryption keys securely
- Generate initialization vectors

**Interface:**

```typescript
interface EncryptionService {
  encrypt(plaintext: string): Promise<EncryptedData>;
  decrypt(encryptedData: EncryptedData): Promise<string>;
  generateKey(): Promise<CryptoKey>;
}

interface EncryptedData {
  ciphertext: string;      // Base64 encoded
  iv: string;              // Initialization vector (Base64)
  authTag: string;         // Authentication tag (Base64)
  algorithm: string;       // "AES-256-GCM"
}
```

**Implementation Details:**
- Algorithm: AES-256-GCM (Galois/Counter Mode)
- Key Derivation: PBKDF2 with 100,000 iterations
- Master Key: Stored in environment variable or key management service
- IV: Randomly generated for each encryption operation
- Authentication: GCM provides authenticated encryption

### 4. Exchange Connector Service

**Responsibilities:**
- Provide unified interface to multiple exchanges
- Test API key connectivity
- Enforce read-only operations
- Handle exchange-specific authentication

**Interface:**

```typescript
interface ExchangeConnectorService {
  testConnection(
    exchange: string,
    apiKey: string,
    apiSecret: string
  ): Promise<ConnectionTestResult>;
  
  getAccountInfo(
    exchange: string,
    apiKey: string,
    apiSecret: string
  ): Promise<AccountInfo>;
  
  getSupportedExchanges(): string[];
  
  validateReadOnlyPermissions(
    exchange: string,
    apiKey: string,
    apiSecret: string
  ): Promise<PermissionCheckResult>;
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  hasReadAccess: boolean;
  hasTradeAccess: boolean;
  testedAt: Date;
}
```

**Supported Exchanges (Initial):**
- Binance
- Coinbase Pro
- Kraken
- Bitfinex

### 5. API Keys Repository

**Responsibilities:**
- Persist encrypted API keys
- Query connections by user
- Update connection metadata
- Maintain audit logs

**Interface:**

```typescript
interface ApiKeysRepository {
  create(connection: ApiKeyConnectionRecord): Promise<ApiKeyConnectionRecord>;
  findByUserId(userId: string): Promise<ApiKeyConnectionRecord[]>;
  findById(id: string): Promise<ApiKeyConnectionRecord | null>;
  update(id: string, updates: Partial<ApiKeyConnectionRecord>): Promise<ApiKeyConnectionRecord>;
  delete(id: string): Promise<void>;
  logConnectionAttempt(log: ConnectionLog): Promise<void>;
}
```

## Data Models

### Database Schema

```sql
-- API Keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange VARCHAR(50) NOT NULL,
  label VARCHAR(255),
  
  -- Encrypted credentials
  encrypted_api_key TEXT NOT NULL,
  encrypted_api_secret TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  encryption_auth_tag TEXT NOT NULL,
  encryption_algorithm VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM',
  
  -- Status and metadata
  status VARCHAR(20) NOT NULL DEFAULT 'enabled',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_tested_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  
  -- Indexes
  CONSTRAINT api_keys_status_check CHECK (status IN ('enabled', 'disabled')),
  INDEX idx_api_keys_user_id (user_id),
  INDEX idx_api_keys_status (status),
  UNIQUE INDEX idx_api_keys_user_exchange (user_id, exchange, label)
);

-- Connection logs table (audit trail)
CREATE TABLE connection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation VARCHAR(50) NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_connection_logs_api_key_id (api_key_id),
  INDEX idx_connection_logs_user_id (user_id),
  INDEX idx_connection_logs_created_at (created_at)
);
```

### TypeScript Types

```typescript
interface ApiKeyConnection {
  id: string;
  userId: string;
  exchange: string;
  label?: string;
  maskedKey: string;
  status: 'enabled' | 'disabled';
  createdAt: Date;
  updatedAt: Date;
  lastTestedAt?: Date;
  lastSyncAt?: Date;
}

interface ApiKeyConnectionRecord extends ApiKeyConnection {
  encryptedApiKey: string;
  encryptedApiSecret: string;
  encryptionIv: string;
  encryptionAuthTag: string;
  encryptionAlgorithm: string;
}

interface ConnectionLog {
  id: string;
  apiKeyId: string;
  userId: string;
  operation: string;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

interface DecryptedCredentials {
  apiKey: string;
  apiSecret: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Format validation precedes storage
*For any* API key submission, format validation must be performed and pass before any storage operation is attempted.
**Validates: Requirements 1.1**

### Property 2: Connectivity testing precedes storage
*For any* API key submission, a connectivity test must be performed before the credentials are stored in the database.
**Validates: Requirements 1.2**

### Property 3: Successful connectivity enables storage
*For any* API key with a successful connectivity test result, the system must store the encrypted credentials in the database.
**Validates: Requirements 1.3**

### Property 4: Failed connectivity prevents storage
*For any* API key with a failed connectivity test result, the system must not store the credentials and must return an error message.
**Validates: Requirements 1.4**

### Property 5: Encryption round-trip consistency
*For any* API key and secret pair, encrypting then decrypting the credentials should produce values equivalent to the original plaintext.
**Validates: Requirements 1.5, 8.1, 8.2**

### Property 6: Stored credentials are encrypted
*For any* API key stored in the database, the stored values must be encrypted (not plaintext) and must be different from the original input values.
**Validates: Requirements 1.5, 8.1, 8.2**

### Property 7: List completeness
*For any* user with stored connections, requesting the connection list must return all connections belonging to that user with exchange names and status.
**Validates: Requirements 2.1**

### Property 8: Response credential exclusion
*For any* API response containing connection information, the response must not include the actual plaintext API key or secret values.
**Validates: Requirements 2.2**

### Property 9: Response field completeness
*For any* connection in a list response, the response must include status, last tested timestamp (if tested), and a properly masked API key.
**Validates: Requirements 2.3, 2.4, 2.5**

### Property 10: API key masking format
*For any* API key of length >= 8 characters, the masked version must show only the first 4 and last 4 characters with ellipsis in between.
**Validates: Requirements 2.5**

### Property 11: Status transition consistency
*For any* connection, toggling the status (enabled to disabled or disabled to enabled) must result in the opposite status being stored.
**Validates: Requirements 3.1, 3.2**

### Property 12: Status-based filtering
*For any* data retrieval operation, only connections with status 'enabled' must be used, and connections with status 'disabled' must be excluded.
**Validates: Requirements 3.3, 3.4**

### Property 13: Update requires connectivity test
*For any* API key update operation, a connectivity test must be performed with the new credentials before any changes are persisted.
**Validates: Requirements 4.1**

### Property 14: Successful update replaces credentials
*For any* API key update with a successful connectivity test, the stored encrypted credentials must be replaced with the new encrypted credentials.
**Validates: Requirements 4.2**

### Property 15: Failed update preserves original
*For any* API key update with a failed connectivity test, the original credentials must remain unchanged in the database.
**Validates: Requirements 4.3**

### Property 16: Update preserves metadata invariants
*For any* API key update operation, the connection's creation date, user ID, and exchange name must remain unchanged.
**Validates: Requirements 4.4**

### Property 17: Deletion completeness
*For any* connection deletion request, the connection record must be completely removed from the database and must not be retrievable afterward.
**Validates: Requirements 5.1, 5.2**

### Property 18: Deletion irreversibility
*For any* deleted connection, attempting to decrypt or retrieve the credentials must fail, ensuring no credential information is recoverable.
**Validates: Requirements 5.3**

### Property 19: Credential exclusion from system outputs
*For any* system output (logs, error messages, debug output), the actual API key and secret values must not be present in plaintext.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 20: Read-only endpoint restriction
*For any* exchange API call made by the system, the endpoint must be from a whitelist of read-only operations and must not be a trading or withdrawal endpoint.
**Validates: Requirements 9.1**

### Property 21: Trading permission detection
*For any* API key validation, if trading permissions are detected, the system must return a warning recommending read-only configuration.
**Validates: Requirements 9.2, 9.3**



## Error Handling

### Error Categories

1. **Validation Errors (400 Bad Request)**
   - Invalid API key format
   - Missing required fields
   - Invalid exchange name
   - Invalid status value

2. **Authentication Errors (401 Unauthorized)**
   - User not authenticated
   - Invalid session token

3. **Authorization Errors (403 Forbidden)**
   - User attempting to access another user's API keys
   - Insufficient permissions

4. **Connectivity Errors (422 Unprocessable Entity)**
   - Exchange API connectivity test failed
   - Invalid credentials
   - Exchange API rate limit exceeded
   - Exchange API temporarily unavailable

5. **Not Found Errors (404 Not Found)**
   - Connection ID does not exist
   - Connection does not belong to user

6. **Server Errors (500 Internal Server Error)**
   - Encryption/decryption failure
   - Database connection failure
   - Unexpected system errors

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
  requestId: string;
}
```

### Error Handling Strategies

1. **Graceful Degradation**: If one exchange connection fails, others continue to work
2. **Retry Logic**: Automatic retry for transient exchange API failures (with exponential backoff)
3. **Circuit Breaker**: Temporarily disable connections that consistently fail
4. **User Feedback**: Clear, actionable error messages without exposing sensitive details
5. **Audit Trail**: Log all errors (without credentials) for debugging and security monitoring

### Security Considerations for Errors

- Never include API keys or secrets in error messages
- Mask connection IDs in public-facing errors
- Log detailed errors server-side for debugging
- Rate limit error responses to prevent information disclosure attacks
- Use generic messages for authentication failures to prevent user enumeration

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Encryption Service Tests**
   - Test encryption/decryption with known inputs
   - Test with empty strings
   - Test with very long strings
   - Test IV uniqueness across multiple encryptions

2. **API Key Masking Tests**
   - Test with keys of various lengths (< 8, = 8, > 8 characters)
   - Test with special characters
   - Test with empty strings

3. **Validation Tests**
   - Test format validation for each supported exchange
   - Test with malformed inputs
   - Test with SQL injection attempts

4. **Repository Tests**
   - Test CRUD operations
   - Test query filtering by user ID
   - Test cascade deletion of related records

5. **Controller Tests**
   - Test request validation
   - Test authorization checks
   - Test error response formatting

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using a PBT library. The system will use **fast-check** for TypeScript/JavaScript property-based testing.

**Configuration**: Each property-based test must run a minimum of 100 iterations to ensure adequate coverage of the input space.

**Tagging Convention**: Each property-based test must include a comment tag in this exact format:
```typescript
// Feature: api-key-management, Property {number}: {property_text}
```

**Key Properties to Test**:

1. **Encryption Round-Trip** (Property 5)
   - Generate random strings of varying lengths
   - Verify encrypt(decrypt(x)) === x for all inputs

2. **Credential Exclusion** (Property 8, 19)
   - Generate random API keys and secrets
   - Verify they never appear in responses, logs, or errors

3. **Masking Format** (Property 10)
   - Generate random API keys of various lengths
   - Verify masking follows the pattern: first4...last4

4. **Status Transitions** (Property 11)
   - Generate random initial states
   - Verify toggle operations produce opposite states

5. **Update Preservation** (Property 16)
   - Generate random connection metadata
   - Verify immutable fields remain unchanged after updates

6. **Deletion Completeness** (Property 17)
   - Generate random connections
   - Verify complete removal after deletion

7. **Read-Only Enforcement** (Property 20)
   - Generate random endpoint paths
   - Verify only whitelisted read-only endpoints are allowed

### Integration Testing

Integration tests will verify component interactions:

1. **End-to-End Connection Flow**
   - Create connection → Test connectivity → Store encrypted → Retrieve → Decrypt → Use

2. **Multi-Exchange Support**
   - Test with multiple exchanges simultaneously
   - Verify isolation between connections

3. **Database Integration**
   - Test with real database
   - Verify encryption at rest
   - Test transaction rollback on failures

4. **Exchange API Integration**
   - Test with exchange sandbox/testnet APIs
   - Verify read-only enforcement
   - Test error handling for various exchange responses

### Security Testing

1. **Penetration Testing**
   - Attempt to retrieve other users' API keys
   - Attempt SQL injection in queries
   - Attempt to bypass encryption

2. **Credential Leakage Testing**
   - Scan all logs for plaintext credentials
   - Scan error messages for credential exposure
   - Verify encrypted data cannot be decrypted without proper keys

3. **Rate Limiting Testing**
   - Verify rate limits prevent brute force attacks
   - Test circuit breaker functionality

## Frontend Components

### 1. Settings Page Layout

```typescript
// SettingsPage.tsx
interface SettingsPageProps {
  user: User;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user }) => {
  return (
    <div className="settings-page">
      <SecurityDisclaimer />
      <ConnectedExchangesList />
      <AddConnectionButton />
    </div>
  );
};
```

### 2. Security Disclaimer Component

```typescript
// SecurityDisclaimer.tsx
const SecurityDisclaimer: React.FC = () => {
  return (
    <div className="security-disclaimer alert alert-warning">
      <h3>⚠️ Security Notice</h3>
      <ul>
        <li>You are responsible for the security of your API keys</li>
        <li>Only add API keys with READ-ONLY permissions</li>
        <li>Never grant trading or withdrawal permissions</li>
        <li>We encrypt your keys, but you should still use read-only access</li>
        <li>Revoke keys immediately if you suspect compromise</li>
      </ul>
    </div>
  );
};
```

### 3. Connected Exchanges List

```typescript
// ConnectedExchangesList.tsx
interface ConnectedExchangesListProps {
  connections: ApiKeyConnection[];
  onToggleStatus: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
}

const ConnectedExchangesList: React.FC<ConnectedExchangesListProps> = ({
  connections,
  onToggleStatus,
  onDelete,
  onTest
}) => {
  return (
    <div className="connections-list">
      <h2>Connected Exchanges</h2>
      {connections.length === 0 ? (
        <EmptyState />
      ) : (
        connections.map(conn => (
          <ConnectionCard
            key={conn.id}
            connection={conn}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
            onTest={onTest}
          />
        ))
      )}
    </div>
  );
};
```

### 4. Connection Card

```typescript
// ConnectionCard.tsx
interface ConnectionCardProps {
  connection: ApiKeyConnection;
  onToggleStatus: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  onToggleStatus,
  onDelete,
  onTest
}) => {
  return (
    <div className={`connection-card ${connection.status}`}>
      <div className="connection-header">
        <img src={`/icons/${connection.exchange}.png`} alt={connection.exchange} />
        <h3>{connection.exchange}</h3>
        <StatusBadge status={connection.status} />
      </div>
      
      <div className="connection-details">
        <div className="detail-row">
          <span className="label">API Key:</span>
          <code className="masked-key">{connection.maskedKey}</code>
        </div>
        <div className="detail-row">
          <span className="label">Label:</span>
          <span>{connection.label || 'N/A'}</span>
        </div>
        <div className="detail-row">
          <span className="label">Last Tested:</span>
          <span>{formatDate(connection.lastTestedAt)}</span>
        </div>
        <div className="detail-row">
          <span className="label">Last Sync:</span>
          <span>{formatDate(connection.lastSyncAt)}</span>
        </div>
      </div>
      
      <div className="connection-actions">
        <button onClick={() => onTest(connection.id)}>
          Test Connection
        </button>
        <button onClick={() => onToggleStatus(connection.id, !connection.status)}>
          {connection.status === 'enabled' ? 'Disable' : 'Enable'}
        </button>
        <button onClick={() => onDelete(connection.id)} className="danger">
          Remove
        </button>
      </div>
    </div>
  );
};
```

### 5. Add Connection Form

```typescript
// AddConnectionForm.tsx
interface AddConnectionFormProps {
  onSubmit: (data: NewConnectionData) => Promise<void>;
  onCancel: () => void;
}

interface NewConnectionData {
  exchange: string;
  apiKey: string;
  apiSecret: string;
  label?: string;
}

const AddConnectionForm: React.FC<AddConnectionFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<NewConnectionData>({
    exchange: '',
    apiKey: '',
    apiSecret: '',
    label: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-connection-form">
      <h2>Add Exchange Connection</h2>
      
      <ReadOnlyWarning />
      
      <div className="form-group">
        <label htmlFor="exchange">Exchange *</label>
        <select
          id="exchange"
          value={formData.exchange}
          onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
          required
        >
          <option value="">Select an exchange...</option>
          <option value="binance">Binance</option>
          <option value="coinbase">Coinbase Pro</option>
          <option value="kraken">Kraken</option>
          <option value="bitfinex">Bitfinex</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="apiKey">API Key *</label>
        <input
          id="apiKey"
          type="text"
          value={formData.apiKey}
          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
          placeholder="Enter your API key"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="apiSecret">API Secret *</label>
        <input
          id="apiSecret"
          type="password"
          value={formData.apiSecret}
          onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
          placeholder="Enter your API secret"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="label">Label (Optional)</label>
        <input
          id="label"
          type="text"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="e.g., My Main Account"
        />
      </div>
      
      <ExchangeInstructions exchange={formData.exchange} />
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Testing Connection...' : 'Add Connection'}
        </button>
      </div>
    </form>
  );
};
```

### 6. Read-Only Warning Component

```typescript
// ReadOnlyWarning.tsx
const ReadOnlyWarning: React.FC = () => {
  return (
    <div className="read-only-warning alert alert-info">
      <h4>🔒 Important: Use Read-Only API Keys</h4>
      <p>
        For your security, only add API keys with <strong>read-only permissions</strong>.
        Do not grant trading, withdrawal, or transfer permissions.
      </p>
      <details>
        <summary>How to create read-only API keys</summary>
        <ol>
          <li>Log into your exchange account</li>
          <li>Navigate to API Management settings</li>
          <li>Create a new API key</li>
          <li>Enable ONLY "Read" or "View" permissions</li>
          <li>Disable all trading, withdrawal, and transfer permissions</li>
          <li>Copy the API key and secret to this form</li>
        </ol>
      </details>
    </div>
  );
};
```

### 7. Exchange-Specific Instructions

```typescript
// ExchangeInstructions.tsx
interface ExchangeInstructionsProps {
  exchange: string;
}

const ExchangeInstructions: React.FC<ExchangeInstructionsProps> = ({ exchange }) => {
  const instructions = {
    binance: {
      url: 'https://www.binance.com/en/my/settings/api-management',
      permissions: ['Enable Reading', 'Disable Spot & Margin Trading', 'Disable Withdrawals']
    },
    coinbase: {
      url: 'https://pro.coinbase.com/profile/api',
      permissions: ['View', 'Disable Trade', 'Disable Transfer']
    },
    kraken: {
      url: 'https://www.kraken.com/u/security/api',
      permissions: ['Query Funds', 'Query Open Orders', 'Query Closed Orders', 'Disable Create/Modify Orders']
    },
    bitfinex: {
      url: 'https://www.bitfinex.com/api',
      permissions: ['Read-only access', 'Disable Trading', 'Disable Withdrawals']
    }
  };

  if (!exchange || !instructions[exchange]) {
    return null;
  }

  const { url, permissions } = instructions[exchange];

  return (
    <div className="exchange-instructions">
      <h4>Setting up {exchange} API Key</h4>
      <p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Create API Key on {exchange} →
        </a>
      </p>
      <p>Required permissions:</p>
      <ul>
        {permissions.map((perm, idx) => (
          <li key={idx}>{perm}</li>
        ))}
      </ul>
    </div>
  );
};
```

## Implementation Notes

### Environment Variables

```bash
# .env
ENCRYPTION_MASTER_KEY=<base64-encoded-256-bit-key>
DATABASE_URL=postgresql://user:pass@localhost:5432/crypto_analytics
API_RATE_LIMIT_PER_MINUTE=60
EXCHANGE_API_TIMEOUT_MS=5000
```

### Encryption Key Management

For production deployments, consider using a dedicated key management service:
- AWS KMS (Key Management Service)
- Google Cloud KMS
- Azure Key Vault
- HashiCorp Vault

The master encryption key should:
- Be rotated periodically (e.g., every 90 days)
- Never be committed to version control
- Be backed up securely
- Have access controls and audit logging

### Performance Considerations

1. **Caching**: Cache decrypted credentials in memory for a short duration (e.g., 5 minutes) to reduce decryption overhead
2. **Connection Pooling**: Reuse exchange API connections when possible
3. **Async Operations**: Perform connectivity tests asynchronously to avoid blocking
4. **Batch Operations**: Support bulk status updates for multiple connections
5. **Database Indexing**: Ensure proper indexes on user_id and status columns

### Scalability Considerations

1. **Horizontal Scaling**: Service is stateless and can be scaled horizontally
2. **Database Sharding**: Shard by user_id if needed for very large user bases
3. **Rate Limiting**: Implement per-user rate limits to prevent abuse
4. **Circuit Breakers**: Prevent cascading failures when exchanges are down
5. **Monitoring**: Track encryption/decryption performance, API call latencies, and error rates

## Migration Strategy

### Phase 1: Core Infrastructure
- Set up database schema
- Implement encryption service
- Create repository layer

### Phase 2: Backend API
- Implement API key management service
- Create REST endpoints
- Add authentication and authorization

### Phase 3: Exchange Integration
- Implement exchange connector service
- Add support for initial exchanges (Binance, Coinbase)
- Implement connectivity testing

### Phase 4: Frontend
- Create settings page
- Implement connection management UI
- Add security warnings and instructions

### Phase 5: Testing & Security
- Comprehensive security audit
- Property-based testing implementation
- Load testing and performance optimization

### Phase 6: Monitoring & Operations
- Set up logging and monitoring
- Implement alerting for security events
- Create operational runbooks
