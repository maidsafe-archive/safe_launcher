# SAFE Launcher Change Log

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
