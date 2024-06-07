import type { ColumnType } from "kysely";
export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Analytics = {
  id: Generated<number>;
  created: Generated<Timestamp>;
  event: Generated<string>;
  identifier: string;
  type: string;
};
export type Collection = {
  id: string;
  title: Generated<string>;
  created: Generated<Timestamp>;
  creators: Generated<unknown>;
  description: Generated<string>;
  detailed_description: Generated<string>;
  identifier: string;
  image_url: Generated<string>;
  private: Generated<boolean>;
  random_int: Generated<number>;
  updated: Timestamp;
  workspace_id: string | null;
};
export type CollectionAccess = {
  collection_id: string;
  created: Generated<Timestamp>;
  hidden: Generated<boolean>;
  role: string;
  updated: Timestamp;
  user_id: string;
};
export type ExternalRelation = {
  id: string;
  action: string | null;
  created: Generated<Timestamp>;
  original_relation_id: string | null;
  resource_type: string | null;
  source_id: string;
  target: string;
  target_type: string;
  type: string;
  updated: Timestamp;
};
export type ExternalRelationToVersion = {
  A: string;
  B: string;
};
export type InternalRelation = {
  id: string;
  action: string | null;
  created: Generated<Timestamp>;
  mirror: Generated<boolean>;
  original_relation_id: string | null;
  resource_type: string | null;
  source_id: string;
  target_id: string;
  type: string;
  updated: Timestamp;
};
export type InternalRelationToVersion = {
  A: string;
  B: string;
};
export type Invite = {
  created: Generated<Timestamp>;
  email_address: string;
  updated: Timestamp;
  workspace_id: string;
};
export type Notification = {
  id: string;
  title: Generated<string>;
  content: Generated<string>;
  created: Generated<Timestamp>;
  read: Generated<boolean>;
  target: Generated<string>;
  updated: Timestamp;
  user_id: string;
};
export type Resource = {
  id: string;
  title: Generated<string>;
  action: string | null;
  back_link_id: string | null;
  created: Generated<Timestamp>;
  description: Generated<string>;
  filled_in: Generated<boolean>;
  identifier: string;
  identifier_type: string;
  original_resource_id: string | null;
  resource_type: Generated<string>;
  updated: Timestamp;
  version_label: string | null;
};
export type ResourceToVersion = {
  A: string;
  B: string;
};
export type Starred = {
  collection_id: string;
  created: Generated<Timestamp>;
  user_id: string;
};
export type User = {
  id: string;
  username: string;
  name: string;
  affiliation: string;
  contact_email_address: string;
  created: Generated<Timestamp>;
  email_address: string;
  website: string;
};
export type Version = {
  id: string;
  name: Generated<string>;
  changelog: Generated<string>;
  collection_id: string;
  created: Generated<Timestamp>;
  creators: Generated<unknown>;
  identifier: string;
  published: Generated<boolean>;
  published_on: Timestamp | null;
  updated: Timestamp;
};
export type Workspace = {
  id: string;
  title: Generated<string>;
  created: Generated<Timestamp>;
  description: Generated<string>;
  personal: Generated<boolean>;
  type: Generated<string>;
  updated: Timestamp;
};
export type WorkspaceMember = {
  admin: Generated<boolean>;
  created: Generated<Timestamp>;
  owner: Generated<boolean>;
  updated: Timestamp;
  user_id: string;
  workspace_id: string;
};
export type DB = {
  _ExternalRelationToVersion: ExternalRelationToVersion;
  _InternalRelationToVersion: InternalRelationToVersion;
  _ResourceToVersion: ResourceToVersion;
  Analytics: Analytics;
  Collection: Collection;
  CollectionAccess: CollectionAccess;
  ExternalRelation: ExternalRelation;
  InternalRelation: InternalRelation;
  Invite: Invite;
  Notification: Notification;
  Resource: Resource;
  Starred: Starred;
  User: User;
  Version: Version;
  Workspace: Workspace;
  WorkspaceMember: WorkspaceMember;
};
