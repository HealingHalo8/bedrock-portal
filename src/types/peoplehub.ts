export interface RESTPeoplehubResponse {
  people: Person[];
  recommendationSummary: null;
  friendFinderState: null;
  accountLinkDetails: null;
}

export interface Person {
  xuid: string;
  isFavorite: boolean;
  isFollowingCaller: boolean;
  isFollowedByCaller: boolean;
  isIdentityShared: boolean;
  addedDateTimeUtc: string | null;
  displayName: string;
  realName: string;
  displayPicRaw: string;
  showUserAsAvatar: string;
  gamertag: string;
  gamerScore: string;
  modernGamertag: string;
  modernGamertagSuffix: string;
  uniqueModernGamertag: string;
  xboxOneRep: string;
  presenceState: string;
  presenceText: string;
  presenceDevices: null;
  isBroadcasting: boolean;
  isCloaked: null;
  isQuarantined: boolean;
  isXbox360Gamerpic: boolean;
  lastSeenDateTimeUtc: null | string;
  suggestion: null;
  recommendation: null;
  search: null;
  titleHistory: null;
  multiplayerSummary: MultiplayerSummary | null;
  recentPlayer: null;
  follower: Follower;
  preferredColor: PreferredColor;
  presenceDetails: null;
  titlePresence: null;
  titleSummaries: null;
  presenceTitleIds: null;
  detail: Detail;
  communityManagerTitles: null;
  socialManager: null;
  broadcast: null;
  avatar: Avatar | null;
  linkedAccounts: LinkedAccount[];
  colorTheme: string;
  preferredFlag: string;
  preferredPlatforms: string[];
}

export interface Avatar {
  updateTimeOffset: string,
  spritesheetMetadata: string | null,
}

export interface MultiplayerSummary {
    joinableActivities: [],
    partyDetails: [],
    inParty: number,
}

export interface Detail {
  accountTier: string;
  bio: string;
  isVerified: boolean;
  location: string;
  tenure: string;
  watermarks: string[];
  blocked: boolean;
  mute: boolean;
  followerCount: number;
  followingCount: number;
  hasGamePass: boolean;
}

export interface Follower {
  text: Text;
  followedDateTime: string;
}

export interface LinkedAccount {
  networkName: string;
  displayName: string;
  showOnProfile: boolean;
  isFamilyFriendly: boolean;
  deeplink: null;
}

export interface PreferredColor {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
}

export enum Device {
  Android = 'Android',
  IOS = 'iOS',
  PlayStation = 'PlayStation',
  Scarlett = 'Scarlett',
  Win32 = 'Win32',
  WindowsOneCore = 'WindowsOneCore',
  XboxOne = 'XboxOne',
}

export interface RESTPeoplehubGetFriendRequestResponse {
  people: FriendRequestPerson[];
  recommendationSummary: null;
  friendFinderState: null;
  accountLinkDetails: null;
  friendRequestSummary: null;
}

export interface FriendRequestPerson {
  detail: FriendRequestPersonDetail;
  follower: Follower;
  recommendation: null;
  isFriend: boolean;
  friendedDateTimeUtc: null;
  isFriendRequestReceived: boolean;
  isFriendRequestSent: boolean;
  xuid: string;
  appXuid: null;
  isFavorite: boolean;
  isFollowingCaller: boolean;
  isFollowedByCaller: boolean;
  isIdentityShared: boolean;
  addedDateTimeUtc: string;
  displayName: string;
  realName: string;
  displayPicRaw: string;
  showUserAsAvatar: string;
  gamertag: string;
  gamerScore: string;
  modernGamertag: string;
  modernGamertagSuffix: string;
  uniqueModernGamertag: string;
  xboxOneRep: string;
  presenceState: string;
  presenceText: string;
  presenceDevices: null;
  isBroadcasting: boolean;
  isCloaked: null;
  isQuarantined: boolean;
  isXbox360Gamerpic: boolean;
  lastSeenDateTimeUtc: string;
  suggestion: null;
  search: null;
  titleHistory: null;
  multiplayerSummary: null;
  recentPlayer: null;
  preferredColor: PreferredColor;
  presenceDetails: null;
  titlePresence: null;
  titleSummaries: null;
  presenceTitleIds: null;
  communityManagerTitles: null;
  socialManager: null;
  broadcast: null;
  avatar: null;
  linkedAccounts: LinkedAccount[];
  colorTheme: string;
  preferredFlag: string;
  preferredPlatforms: string[];
}

export interface FriendRequestPersonDetail {
  canBeFriended: boolean;
  canBeFollowed: boolean;
  isFriend: boolean;
  friendCount: number;
  isFriendRequestReceived: boolean;
  isFriendRequestSent: boolean;
  isFriendListShared: boolean;
  isFollowingCaller: boolean;
  isFollowedByCaller: boolean;
  isFavorite: boolean;
  accountTier: string;
  bio: string;
  isVerified: boolean;
  location: string;
  tenure: string;
  watermarks: string[];
  blocked: boolean;
  mute: boolean;
  followerCount: number;
  followingCount: number;
  hasGamePass: boolean;
}
