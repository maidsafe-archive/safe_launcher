# SAFE Launcher Change Log

##[0.8.1]
- Package identifier updated to match correct reverse DNS identifier
- Updated the forum link
- Fixed empty file handling in NFS
- Fixed ffi process crash during unauthorised access
- Fixed fetch file with metadata via DNS

##[0.8.0]
- Set UI log file path from config handler
- DNS API - removed isPrivate param and replaced with rootPath
- NFS API - restrict root directory deletion
- Start up grey screen fixed
- Log list rendering optimisation
- API - ISO time format fix
- CSP header errors resolved
- Proxy hanging on application crash resolved
- Clear application UI state on logout
- Packaging fixes
- Minor style fixes

##[0.7.1]
- Mapping registration and login with messages based on error codes
- Fetching app root directory failure case handled
- Stop proxy server on logout until unauthorised client is created

##[0.7.0]
- Authorisation now uses secret and password
- NFS modify file API is temporarily disabled
    - until SequentialEncryptor can handle accepting offsets
- Persist user settings through sessions
- Log tab should have content ordered
- Create account UI updated
- Various bug fixes and UX updates

##[0.6.0]
 - New Launcher UI with dashboard and log history
 - NFS Create File API updated
 - User credentials merged to a single input
 - Proxy bug fixes
 - FFI process restart issue fix

##[0.5.1]
 - Fix for DNS get file error
 - Hide status banner after log in
 - Low balance error handling
 - Log improvements

##[0.5.0]
 - NFS API updated with streaming
 - CORS and CSP moved to proxy
 - Single client handle
 - Removed encryption and base64 conversion
 - Error build script added

##[0.4.6]
 - update to safe_core to 0.15.1
 - Remote process logging integration

##[0.4.5]
  - update safe_core to 0.15.0
  - launcher uses winston for logging

##[0.4.4]
  - depend on safe_core instead of the deprecated safe_ffi
  - dependency updated to safe_core 0.14.6

##[0.4.3]
  - safe_ffi dependencies updated

##[0.4.2]
  - safe_ffi 0.6.2

##[0.4.1]
- safe_ffi 0.5.0
- 500 Error code removed
- 404 added and 202 changed to 200
- file response metadata_undefined issue fixed
- Fixed the issue with user metadata not being updated
- Post Package workflow integration
- API Version Updated to 0.4
- Error Codes updated to match with safe_core
- CORS `Authorization` header added to permitted header list

##[0.4.0]
  - UX update
  - Port opening up issues handled (in use and elevated privilege)
  - FFI process termination handling
  - Network observer implementation
  - safe_ffi 0.4.5
