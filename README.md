# Amazon-S3-Simple-Cloud-Storage
This project is a RESTful API for a cloud storage service that allows users to upload, manage, and share files and directories. It provides various endpoints for handling file and directory operations, user authentication, and permission management.

## **Table of Contents**
   - System Design
   - Features
   - Installation
   - Usage
   - API Endpoints
   - Folder Structure
   - Dependencies
   - Contributing

## **Features**
   - User authentication with JWT tokens
   - File upload, download, and management
   - Directory creation, listing, and movement
   - Search functionality based on file names and metadata
   - File permission management (Public, Private, Shared)

## **Installation**
1. Clone the repository:
   ```
   git clone https://github.com/parassindhwal/amazon-scs.git
   ```
   
3. Navigate to the project directory:
   ```
   cd amazon-scs
   ```

5. Install dependencies:
   ```
   npm install
   ```

7. Start the server:
   ```
   node main.js
   ```

## **Usage**
Once the server is running, you can use tools like Postman to interact with the API endpoints. Ensure you have proper authentication tokens for protected endpoints.

## **API Endpoints**
The API provides the following endpoints:

1. **User Authentication APIs -**
   - **Endpoint:** /api/auth/register
     - **Method:** POST
     - **Description:** Registers a new user.
     - **Request:** JSON object containing username, email, and password.
     - **Response:** Success message or error details.

    - **Endpoint:** /api/auth/login
      - **Method:** POST
      - **Description:** Logs in an existing user.
      - **Request:** JSON object containing email and password.
      - **Response:** JWT token on successful authentication or error details.

    - **Endpoint:** /api/auth/logout
      - **Method:** POST
      - **Description:** Logs out the currently authenticated user.
      - **Request:** JWT token (in the Authorization header).
      - **Response:** Success message or error details.

2. **File Management APIs -**
    - **Endpoint:** /api/files/upload
      - **Method:** POST
      - **Description:** Uploads a file to the user's storage space.
      - **Request:** FormData containing the file to be uploaded.
      - **Response:** Success message or error details.

    - **Endpoint:** /api/files/download/:fileId
      - **Method:** GET
      - **Description:** Download a file by its ID.
      - **Request:** File ID in the URL parameter.
      - **Response:** File download or error message.

    - **Endpoint:** /api/files/list
      - **Method:** GET
      - **Description:** Retrieves a list of the user's uploaded files.
      - **Request:** JWT token (in the Authorization header).
      - **Response:** JSON array of file objects containing file details.

    - **Endpoint:** /api/files/search
      - **Method:** GET
      - **Description:** Searches for files based on filenames or metadata.
      - **Request:** Query parameter for search keyword.
      - **Response:** JSON array of matching file objects.

    - **Endpoint:** /api/files/:fileId/permissions
      - **Method:** POST
      - **Description:** Sets permissions for a specific file.
      - **Request:** JSON object containing user IDs and permission types.
      - **Response:** Success message or error details.

    - **Endpoint:** /api/files/:fileId/versions
      - **Method:** GET
      - **Description:** Retrieves all versions of a file identified by fileId.
      - **Request:** File ID in the URL parameter.
      - **Response:** JSON array of file version objects.

    - **Endpoint:** /api/files/:fileId/versions/:versionId
      - **Method:** GET
      - **Description:** Retrieves a specific version of a file identified by both fileId and versionId.
      - **Request:** File ID and Version ID in the URL parameters.
      - **Response:** File version object.

    - **Endpoint:** /api/files/:fileId/versions/:versionId/restore
      - **Method:** PUT
      - **Description:** Restores a previous version of a file identified by both fileId and versionId.
      - **Request:** File ID and Version ID in the URL parameters.
      - **Response:** Success message or error details.

    - **Endpoint:** /api/files/:fileId/metadata
      - **Method:** POST
      - **Description:** Adds metadata to a file.
      - **Request:** JSON object containing metadata key-value pairs.
      - **Response:** Success message or error details.
        
    - **Endpoint:** /api/files/delete
      - **Method:** DELETE
      - **Description:** Deletes a file or directory.
      - **Request:** JSON object containing type (file or directory) and ids (file IDs or directory IDs) in array.
      - **Response:** Success message or error details.

3. **Directory Management APIs -**
    - **Endpoint:** /api/directories/create
      - **Method:** POST
      - **Description:** Creates a new directory.
      - **Request:** JSON object containing directory name and parent directory ID.
      - **Response:** Success message or error details.

    - **Endpoint:** /api/directories/list
      - **Method:** GET
      - **Description:** Retrieves a list of user's directories.
      - **Request:** JWT token (in the Authorization header).
      - **Response:** JSON array of directory objects containing directory details.

    - **Endpoint:** /api/directories/:directoryId/files
      - **Method:** GET
      - **Description:** Retrieves files within a directory.
      - **Request:** Directory ID in the URL parameter.
      - **Response:** JSON array of file objects within the directory.


## **Dependencies**
- Express - Web framework for Node.js servers
- Sequelize - Promise-based ORM for SQL databases
- mysql2 - Fast MySQL driver for Node.js
- bcrypt - Password hashing library for security
- jsonwebtoken - JWT authentication and authorization
- dotenv - Environment variable management
- Multer - Middleware for handling file uploads
- path - Utility for working with file paths
- fs - File system operations for Node.js
- Nodemon - Automatic server restart on code changes

## **Contributing**
Contributions are welcome! Please fork the repository and submit a pull request with your changes. :smile:
