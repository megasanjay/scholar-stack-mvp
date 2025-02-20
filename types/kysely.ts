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
    id: Generated<number>;
    title: Generated<string>;
    description: Generated<string>;
    detailedDescription: Generated<string>;
    type: Generated<string>;
    imageUrl: Generated<string>;
    private: Generated<boolean>;
    randomInt: Generated<number>;
    created: Generated<Timestamp>;
    updated: Timestamp;
    workspaceId: string | null;
};
export type CollectionAccess = {
    userId: string;
    collectionId: number;
    role: string;
    hidden: Generated<boolean>;
    created: Generated<Timestamp>;
    updated: Timestamp;
};
export type ExternalRelation = {
    id: string;
    sourceId: string;
    originalRelationId: string | null;
    target: string;
    targetType: string;
    type: string;
    resourceType: string | null;
    action: string | null;
    versionId: number | null;
    created: Generated<Timestamp>;
    updated: Timestamp;
};
export type InternalRelation = {
    id: string;
    originalRelationId: string | null;
    sourceId: string;
    targetId: string;
    type: string;
    resourceType: string | null;
    action: string | null;
    mirror: Generated<boolean>;
    versionId: number | null;
    created: Generated<Timestamp>;
    updated: Timestamp;
};
export type Invite = {
    emailAddress: string;
    workspaceId: string;
    created: Generated<Timestamp>;
    updated: Timestamp;
};
export type Notification = {
    id: string;
    title: Generated<string>;
    body: Generated<string>;
    type: Generated<string>;
    url: Generated<string>;
    read: Generated<boolean>;
    userId: string;
    created: Generated<Timestamp>;
    updated: Timestamp;
};
export type Resource = {
    id: string;
    identifierType: string;
    identifier: string;
    title: Generated<string>;
    description: Generated<string>;
    resourceType: Generated<string>;
    versionLabel: string | null;
    backLinkId: string | null;
    originalResourceId: string | null;
    action: string | null;
    created: Generated<Timestamp>;
    updated: Timestamp;
    versionId: number | null;
};
export type Starred = {
    userId: string;
    collectionId: number;
    created: Generated<Timestamp>;
};
export type User = {
    id: string;
    givenName: Generated<string>;
    familyName: Generated<string>;
    affiliation: Generated<string>;
    contactEmailAddress: Generated<string>;
    website: Generated<string>;
    emailAddress: string;
    password: string;
    emailVerified: Generated<boolean>;
    emailVerifiedAt: Timestamp | null;
    emailVerificationToken: string | null;
    emailVerificationTokenExpires: Timestamp | null;
    created: Generated<Timestamp>;
    updated: Timestamp;
};
export type Version = {
    id: Generated<number>;
    collectionId: number;
    name: Generated<string>;
    changelog: Generated<string>;
    creators: Generated<unknown>;
    published: Generated<boolean>;
    publishedOn: Timestamp | null;
    created: Generated<Timestamp>;
    updated: Timestamp;
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
    workspaceId: string;
    userId: string;
    owner: Generated<boolean>;
    admin: Generated<boolean>;
    created: Generated<Timestamp>;
    updated: Timestamp;
};
export type DB = {
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
