import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Analytics = {
    id: Generated<number>;
    identifier: string;
    type: string;
    event: Generated<string>;
    created: Generated<Timestamp>;
};
export type Collection = {
    id: string;
    title: Generated<string>;
    description: Generated<string>;
    detailed_description: Generated<string>;
    image_url: Generated<string>;
    created: Generated<Timestamp>;
    updated: Timestamp;
    identifier: string;
    private: Generated<boolean>;
    random_int: Generated<number>;
    creators: Generated<unknown>;
    workspace_id: string | null;
};
export type CollectionAccess = {
    user_id: string;
    collection_id: string;
    role: string;
    hidden: Generated<boolean>;
    created: Generated<Timestamp>;
    updated: Timestamp;
};
export type ExternalRelation = {
    id: string;
    source_id: string;
    original_relation_id: string | null;
    target: string;
    target_type: string;
    type: string;
    resource_type: string | null;
    action: string | null;
    created: Generated<Timestamp>;
    updated: Timestamp;
};
export type ExternalRelationToVersion = {
    A: string;
    B: string;
};
export type InternalRelation = {
    id: string;
    original_relation_id: string | null;
    source_id: string;
    target_id: string;
    type: string;
    resource_type: string | null;
    action: string | null;
    mirror: Generated<boolean>;
    created: Generated<Timestamp>;
    updated: Timestamp;
};
export type InternalRelationToVersion = {
    A: string;
    B: string;
};
export type Invite = {
    email_address: string;
    workspace_id: string;
    created: Generated<Timestamp>;
    updated: Timestamp;
};
export type Notification = {
    id: string;
    user_id: string;
    title: Generated<string>;
    content: Generated<string>;
    target: Generated<string>;
    read: Generated<boolean>;
    created: Generated<Timestamp>;
    updated: Timestamp;
};
export type Resource = {
    id: string;
    identifier_type: string;
    identifier: string;
    title: Generated<string>;
    description: Generated<string>;
    resource_type: Generated<string>;
    relation_resource_type: Generated<string>;
    back_link_id: string | null;
    version_label: string | null;
    original_resource_id: string | null;
    action: string | null;
    filled_in: Generated<boolean>;
    created: Generated<Timestamp>;
    updated: Timestamp;
};
export type ResourceToVersion = {
    A: string;
    B: string;
};
export type Starred = {
    user_id: string;
    collection_id: string;
    created: Generated<Timestamp>;
};
export type User = {
    id: string;
    email_address: string;
    username: string;
    name: string;
    affiliation: string;
    contact_email_address: string;
    website: string;
    created: Generated<Timestamp>;
};
export type Version = {
    id: string;
    collection_id: string;
    name: Generated<string>;
    changelog: Generated<string>;
    identifier: string;
    creators: Generated<unknown>;
    created: Generated<Timestamp>;
    updated: Timestamp;
    published: Generated<boolean>;
    published_on: Timestamp | null;
};
export type Workspace = {
    id: string;
    title: Generated<string>;
    description: Generated<string>;
    personal: Generated<boolean>;
    type: Generated<string>;
    created: Generated<Timestamp>;
    updated: Timestamp;
};
export type WorkspaceMember = {
    user_id: string;
    workspace_id: string;
    owner: Generated<boolean>;
    admin: Generated<boolean>;
    created: Generated<Timestamp>;
    updated: Timestamp;
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
