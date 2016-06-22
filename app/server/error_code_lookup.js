export function errorCodeLookup(errCode) {
  let CLIENT_ERROR_START_RANGE = -1;
  let NFS_ERROR_START_RANGE = CLIENT_ERROR_START_RANGE - 500;
  let DNS_ERROR_START_RANGE = NFS_ERROR_START_RANGE - 500;
  let FFI_ERROR_START_RANGE = DNS_ERROR_START_RANGE - 500;
  switch (errCode) {
    case CLIENT_ERROR_START_RANGE:
      return 'CoreError::StructuredDataHeaderSizeProhibitive';
    case CLIENT_ERROR_START_RANGE - 1:
      return 'CoreError::UnsuccessfulEncodeDecode';
    case CLIENT_ERROR_START_RANGE - 2:
      return 'CoreError::AsymmetricDecipherFailure';
    case CLIENT_ERROR_START_RANGE - 3:
      return 'CoreError::SymmetricDecipherFailure';
    case CLIENT_ERROR_START_RANGE - 4:
      return 'CoreError::ReceivedUnexpectedData';
    case CLIENT_ERROR_START_RANGE - 5:
      return 'CoreError::VersionCacheMiss';
    case CLIENT_ERROR_START_RANGE - 6:
      return 'CoreError::RootDirectoryAlreadyExists';
    case CLIENT_ERROR_START_RANGE - 7:
      return 'CoreError::RandomDataGenerationFailure';
    case CLIENT_ERROR_START_RANGE - 8:
      return 'CoreError::OperationForbiddenForClient';
    case CLIENT_ERROR_START_RANGE - 9:
      return 'CoreError::Unexpected';
    case CLIENT_ERROR_START_RANGE - 10:
      return 'CoreError::RoutingError';
    case CLIENT_ERROR_START_RANGE - 11:
      return 'CoreError::RoutingInterfaceError';
    case CLIENT_ERROR_START_RANGE - 12:
      return 'CoreError::UnsupportedSaltSizeForPwHash';
    case CLIENT_ERROR_START_RANGE - 13:
      return 'CoreError::UnsuccessfulPwHash';
    case CLIENT_ERROR_START_RANGE - 14:
      return 'CoreError::OperationAborted';
    case CLIENT_ERROR_START_RANGE - 15:
      return 'CoreError::MpidMessagingError';
    case CLIENT_ERROR_START_RANGE - 16:
      return 'CoreError::GetFailure::GetError::NoSuchAccount';
    case CLIENT_ERROR_START_RANGE - 17:
      return 'CoreError::GetFailure::GetError::NoSuchData';
    case CLIENT_ERROR_START_RANGE - 18:
      return 'CoreError::GetFailure::GetError::NetworkOther';
    case CLIENT_ERROR_START_RANGE - 19:
      return 'CoreError::MutationFailure::MutationError::NoSuchAccount';
    case CLIENT_ERROR_START_RANGE - 20:
      return 'CoreError::MutationFailure::MutationError::AccountExists';
    case CLIENT_ERROR_START_RANGE - 21:
      return 'CoreError::MutationFailure::MutationError::NoSuchData';
    case NFS_ERROR_START_RANGE - 1:
      return 'NfsError::DirectoryAlreadyExistsWithSameName';
    case NFS_ERROR_START_RANGE - 2:
      return 'NfsError::DestinationAndSourceAreSame';
    case NFS_ERROR_START_RANGE - 3:
      return 'NfsError::DirectoryNotFound';
    case NFS_ERROR_START_RANGE - 4:
      return 'NfsError::FileAlreadyExistsWithSameName';
    case NFS_ERROR_START_RANGE - 5:
      return 'NfsError::FileDoesNotMatch';
    case NFS_ERROR_START_RANGE - 6:
      return 'NfsError::FileNotFound';
    case NFS_ERROR_START_RANGE - 7:
      return 'NfsError::InvalidRangeSpecified';
    case NFS_ERROR_START_RANGE - 8:
      return 'NfsError::ParameterIsNotValid';
    case NFS_ERROR_START_RANGE - 9:
      return 'NfsError::Unexpected';
    case NFS_ERROR_START_RANGE - 10:
      return 'NfsError::UnsuccessfulEncodeDecode';
    case NFS_ERROR_START_RANGE - 11:
      return 'NfsError::SelfEncryption';
    case DNS_ERROR_START_RANGE:
      return 'DnsError::DnsNameAlreadyRegistered';
    case DNS_ERROR_START_RANGE - 1:
      return 'DnsError::DnsRecordNotFound';
    case DNS_ERROR_START_RANGE - 2:
      return 'DnsError::ServiceAlreadyExists';
    case DNS_ERROR_START_RANGE - 3:
      return 'DnsError::ServiceNotFound';
    case DNS_ERROR_START_RANGE - 4:
      return 'DnsError::DnsConfigFileNotFoundOrCorrupted';
    case DNS_ERROR_START_RANGE - 5:
      return 'DnsError::Unexpected';
    case DNS_ERROR_START_RANGE - 6:
      return 'DnsError::UnsuccessfulEncodeDecode';
    case FFI_ERROR_START_RANGE - 1:
      return 'FfiError::PathNotFound';
    case FFI_ERROR_START_RANGE - 2:
      return 'FfiError::InvalidPath';
    case FFI_ERROR_START_RANGE - 3:
      return 'FfiError::PermissionDenied';
    case FFI_ERROR_START_RANGE - 4:
      return 'FfiError::JsonParseError';
    case FFI_ERROR_START_RANGE - 5:
      return 'FfiError::JsonDecodeError';
    case FFI_ERROR_START_RANGE - 6:
      return 'FfiError::SpecificParseError';
    case FFI_ERROR_START_RANGE - 7:
      return 'FfiError::JsonEncodeError';
    case FFI_ERROR_START_RANGE - 8:
      return 'FfiError::LocalConfigAccessFailed';
    case FFI_ERROR_START_RANGE - 9:
      return 'FfiError::Unexpected';
    case FFI_ERROR_START_RANGE - 10:
      return 'FfiError::UnsuccessfulEncodeDecode';
    default:
      return 'Unexpected error';
  }
};
