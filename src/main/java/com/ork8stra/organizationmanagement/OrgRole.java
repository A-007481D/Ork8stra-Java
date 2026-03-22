package com.ork8stra.organizationmanagement;

/**
 * Scoped roles within an Organization.
 * Ordered by privilege level (highest first).
 */
public enum OrgRole {
    /** Full control: billing, delete org, manage all members */
    ORG_OWNER,

    /** Manage teams, projects, members (cannot delete org) */
    ORG_ADMIN,

    /** Deploy apps, view resources, manage own projects */
    ORG_MEMBER,

    /** Read-only access to dashboards and logs */
    ORG_VIEWER
}
