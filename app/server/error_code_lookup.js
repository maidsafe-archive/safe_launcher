export function errorCodeLookup(errCode) {
  let CLIENT_ERROR_START_RANGE = -1;

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
        return 'CoreError::RoutingMessageCacheMiss';
    case CLIENT_ERROR_START_RANGE - 8:
        return 'CoreError::RootDirectoryAlreadyExists';
    case CLIENT_ERROR_START_RANGE - 9:
        return 'CoreError::RandomDataGenerationFailure';
    case CLIENT_ERROR_START_RANGE - 10:
        return 'CoreError::OperationForbiddenForClient';
    case CLIENT_ERROR_START_RANGE - 11:
        return 'CoreError::Unexpected';
    case CLIENT_ERROR_START_RANGE - 12:
        return 'CoreError::RoutingError';
    case CLIENT_ERROR_START_RANGE - 13:
        return 'CoreError::RoutingInterfaceError';
    case CLIENT_ERROR_START_RANGE - 14:
        return 'CoreError::UnsupportedSaltSizeForPwHash';
    case CLIENT_ERROR_START_RANGE - 15:
        return 'CoreError::UnsuccessfulPwHash';
    case CLIENT_ERROR_START_RANGE - 16:
        return 'CoreError::OperationAborted';
    case CLIENT_ERROR_START_RANGE - 17:
        return 'CoreError::MpidMessagingError';
    default:
        return 'Unclassified error';
  }
};
