# ClearDoc API Reference Manual

The ClearDoc backend exposes a RESTful API with JSON payloads over HTTP. All endpoints are prefixed with `/api/v1`.

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### 1.1 Register New Account
* **Method**: `POST`
* **Path**: `/api/v1/auth/register`
* **Purpose**: Register a new user account with salted Bcrypt password hashing.
* **Authentication**: None (Public)
* **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePassword123"
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "c1f6d390-3b2e-4b68-8742-16cf13a6120b",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-10-30T10:15:30.000Z"
    }
  }
  ```
* **Error Responses**:
  * `400 Bad Request`: Validation failure (e.g. password < 8 characters).
  * `409 Conflict`: Email address already registered.

---

### 1.2 User Login
* **Method**: `POST`
* **Path**: `/api/v1/auth/login`
* **Purpose**: Authenticate an existing user and generate a signed JWT session token.
* **Authentication**: None (Public)
* **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "SecurePassword123"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "c1f6d390-3b2e-4b68-8742-16cf13a6120b",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
  ```
* **Error Responses**:
  * `400 Bad Request`: Missing email or password.
  * `401 Unauthorized`: Invalid credentials.

---

### 1.3 Get Current User Profile
* **Method**: `GET`
* **Path**: `/api/v1/auth/me`
* **Purpose**: Retrieve the authenticated user's profile from the session token.
* **Authentication**: Required (`Authorization: Bearer <token>`)
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "c1f6d390-3b2e-4b68-8742-16cf13a6120b",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-10-30T10:15:30.000Z"
    }
  }
  ```
* **Error Response**:
  * `401 Unauthorized`: Missing or expired token.

---

## 2. Document Analysis & Management (`/api/v1/documents`)

### 2.1 Analyze Document (Core AI Ingestion)
* **Method**: `POST`
* **Path**: `/api/v1/documents/analyze`
* **Purpose**: Ingest an uploaded PDF or image, extract text in memory, analyze via Groq AI, and save the structured result.
* **Authentication**: Required (`Authorization: Bearer <token>`)
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  * `file`: Binary document file (PDF, PNG, JPEG, JPG, max 10MB).
  * `language` *(optional)*: Target analysis language code (default `'en'`).
* **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Document analyzed and saved successfully.",
    "document": {
      "id": "8a329d47-66a8-4ceb-8bb5-b59fe3e3da51",
      "file_name": "electricity_bill.pdf",
      "mime_type": "application/pdf",
      "doc_type": "Electricity Bill",
      "sender": "State Power Corporation",
      "plain_summary": "This is your monthly electricity statement for June...",
      "analysis": {
        "doc_type": "Electricity Bill",
        "sender": "State Power Corporation",
        "plain_summary": "Your bill total is ₹2,740 due on 15 July.",
        "key_facts": [
          { "label": "Amount Due", "value": "₹2,740", "confidence": 0.98 }
        ],
        "deadlines": [
          { "what": "Payment Due Date", "date": "15 July 2026" }
        ],
        "risks": [
          { "level": "medium", "note": "Late payment fee of ₹150 applies after 15 July." }
        ],
        "needs_human_check": [],
        "next_steps": [
          "Pay before 15 July to avoid penalty fees."
        ]
      },
      "created_at": "2026-10-30T12:00:00.000Z"
    }
  }
  ```
* **Error Responses**:
  * `400 Bad Request`: Unsupported file type or file exceeds 10MB.
  * `500 Internal Server Error`: AI inference failure or database error.

---

### 2.2 Validate Upload Only
* **Method**: `POST`
* **Path**: `/api/v1/documents/validate-upload`
* **Purpose**: Verify file integrity and magic bytes without running AI analysis.
* **Authentication**: Required (`Authorization: Bearer <token>`)
* **Content-Type**: `multipart/form-data`
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "File upload validated successfully.",
    "file": {
      "originalName": "bill.pdf",
      "sizeBytes": 1420580,
      "mimeType": "application/pdf",
      "detectedType": "pdf"
    }
  }
  ```

---

### 2.3 List Document History
* **Method**: `GET`
* **Path**: `/api/v1/documents`
* **Purpose**: Retrieve a paginated list of documents owned by the authenticated user.
* **Authentication**: Required (`Authorization: Bearer <token>`)
* **Query Parameters**:
  * `page` *(optional)*: Page number (default `1`).
  * `limit` *(optional)*: Items per page (default `10`).
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "documents": [
      {
        "id": "8a329d47-66a8-4ceb-8bb5-b59fe3e3da51",
        "file_name": "electricity_bill.pdf",
        "doc_type": "Electricity Bill",
        "sender": "State Power Corporation",
        "plain_summary": "This is your monthly electricity statement...",
        "created_at": "2026-10-30T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

---

### 2.4 Get Single Document
* **Method**: `GET`
* **Path**: `/api/v1/documents/:id`
* **Purpose**: Retrieve full details and analysis payload for a specific document.
* **Authentication**: Required (`Authorization: Bearer <token>`)
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "document": {
      "id": "8a329d47-66a8-4ceb-8bb5-b59fe3e3da51",
      "user_id": "c1f6d390-3b2e-4b68-8742-16cf13a6120b",
      "file_name": "electricity_bill.pdf",
      "mime_type": "application/pdf",
      "doc_type": "Electricity Bill",
      "sender": "State Power Corporation",
      "plain_summary": "...",
      "analysis": { ... },
      "created_at": "2026-10-30T12:00:00.000Z"
    }
  }
  ```
* **Error Response**:
  * `404 Not Found`: Document does not exist or belongs to another user.

---

### 2.5 Ask Grounded Follow-up Question
* **Method**: `POST`
* **Path**: `/api/v1/documents/:id/ask`
* **Purpose**: Ask an AI question grounded directly in the document's facts.
* **Authentication**: Required (`Authorization: Bearer <token>`)
* **Request Body**:
  ```json
  {
    "question": "What happens if I miss the due date?",
    "language": "en"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "question": {
      "id": "2b938f32-7a8e-4a6c-9417-38ae078170c3",
      "document_id": "8a329d47-66a8-4ceb-8bb5-b59fe3e3da51",
      "question": "What happens if I miss the due date?",
      "answer": "According to your bill, paying after 15 July incurs a late surcharge fee of ₹150.",
      "is_grounded": true,
      "created_at": "2026-10-30T12:05:00.000Z"
    }
  }
  ```

---

### 2.6 Get Document Q&A History
* **Method**: `GET`
* **Path**: `/api/v1/documents/:id/questions`
* **Purpose**: Retrieve past conversation thread for a document.
* **Authentication**: Required (`Authorization: Bearer <token>`)
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "questions": [
      {
        "id": "2b938f32-7a8e-4a6c-9417-38ae078170c3",
        "question": "What happens if I miss the due date?",
        "answer": "...",
        "is_grounded": true,
        "created_at": "2026-10-30T12:05:00.000Z"
      }
    ]
  }
  ```

---

### 2.7 Delete Document
* **Method**: `DELETE`
* **Path**: `/api/v1/documents/:id`
* **Purpose**: Permanently delete a document and cascade-delete its Q&A and actions.
* **Authentication**: Required (`Authorization: Bearer <token>`)
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Document deleted successfully."
  }
  ```
* **Error Response**:
  * `404 Not Found`: Document not found or not owned by the user.

---

## 3. System Health (`/api/v1/health`)

### 3.1 Health Check
* **Method**: `GET`
* **Path**: `/api/v1/health`
* **Purpose**: Monitor server readiness, database connection, and AI engine status.
* **Authentication**: None (Public)
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-10-30T12:00:00.000Z",
    "database_connected": true,
    "ai_service": "groq",
    "ai_model": "qwen/qwen3.8-27b"
  }
  ```
