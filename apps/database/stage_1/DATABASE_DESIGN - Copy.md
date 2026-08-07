# EduTrack ERP

# Admission Module Database Design

Version: 1.0
Status: Design Freeze

---

# Overview

This document describes the database design for the EduTrack Admission Module.

The design follows the principles of:

- Third Normal Form (3NF)
- Multi-tenant architecture
- Audit trail support
- Business-driven normalization
- Scalable ERP design

The admission workflow covered is:

Lead
→ CRM
→ Counselling
→ Campus Visit
→ Application
→ Document Verification
→ Assessment
→ Admission Decision
→ Fee Payment
→ Student
→ Enrollment

---

# Design Principles

## 1. Multi-Tenant

Every business entity belongs to an Organization.

Organization is the root of the database hierarchy.

Example:

Organization
↓
Users
↓
Staff
↓
Leads
↓
Applications

---

## 2. Normalization

The database follows Third Normal Form.

Redundant data has been eliminated.

Examples:

✔ Student does not store current grade.

Current grade is determined from Student Enrollment.

✔ Admission Documents use Document Types instead of storing document names repeatedly.

✔ Parent relationship is stored in Student Parents instead of Parents.

---

## 3. Audit Fields

Most transactional tables contain:

created_at

updated_at

created_by

updated_by

This provides complete audit history.

---

## 4. Business Identifiers

System IDs use UUID.

Business users interact with readable numbers.

Examples:

Lead Number

ENQ-2026-000124

Application Number

APP-2026-000031

Admission Number

ADM-2026-000018

Employee Code

EMP-000456

---

# Module Structure

Core

Organizations

Users

Roles

User Roles

HR

Departments

Designations

Staff

Admission Configuration

Academic Years

Grades

Academic Year Grades

Sections

Admission Configurations

CRM

Leads

Lead Activities

Lead Visits

Admission

Applications

Document Types

Admission Documents

Assessment Configurations

Application Assessments

Admission Decisions

Admission Fee Payments (Temporary)

Students

Students

Parents

Student Parents

Student Enrollments

---

# Important Design Decisions

## Organization Specific Roles

Roles belong to an Organization.

Different organizations may have roles with the same name.

Example:

School A

HR

School B

HR

Therefore:

UNIQUE(org_id, role_name)

instead of

UNIQUE(role_name)

---

## User Roles

User Roles only stores:

user_id

role_id

The organization is determined through the Role.

Avoids redundant storage.

---

## Student Current Grade

Students do NOT store:

current_grade_id

current_section_id

Reason:

Current academic information already exists in Student Enrollments.

Avoids duplicate updates during promotion.

---

## Application Number

Applications have their own business identifier.

Lead Number

↓

Application Number

The enquiry number is not reused.

---

## Document Types

Document names are normalized.

Instead of

Birth Certificate

Passport

Photo

inside every document record,

a master table stores document definitions.

---

## Parent Relationship

Relationship belongs to

Student Parent

not

Parent.

Example

Same Parent

↓

Father of Student A

Guardian of Student B

---

## Assessment

Assessment is separated into

Configuration

↓

Assessment Result

Configuration defines

Mode

Maximum Marks

Pass Marks

Application Assessment stores

Actual Result

Marks

Percentage

Remarks

---

## Admission Decision

Decision is stored separately.

Applications are not overloaded with

Approval

Waitlist

Scholarship

Offer Expiry

---

## Student Enrollment

Enrollment stores

Academic Year

Grade

Section

Roll Number

Status

Student stores only permanent information.

---

# Temporary Components

Admission Fee Payments

This table is a temporary placeholder.

It will be replaced by the Finance Module.

No additional optimization was performed intentionally.

---

# Index Strategy

Indexes are created on

Foreign Keys

Status columns

Business search columns

Examples

lead_id

application_id

student_id

academic_year_grade_id

section_id

status

org_id

The design intentionally avoids over-indexing.

---

# Trigger Strategy

Every table containing

updated_at

uses

set_updated_at()

through a BEFORE UPDATE trigger.

---

# Naming Convention

Tables

snake_case

Plural

Examples

students

lead_activities

document_types

Columns

snake_case

Primary Keys

table_id

Foreign Keys

referenced_table_id

Indexes

ix_table_column

Triggers

trg_table_updated

Enums

snake_case

---

# Admission Workflow

1. Lead Captured

↓

2. AI Admissions Chatbot

↓

3. CRM Lead Creation

↓

4. AI Lead Scoring

↓

5. Counselling Scheduled

↓

6. Campus Visit

↓

7. Application Submitted

↓

8. Document Upload

↓

9. Document Verification

↓

10. Assessment

↓

11. Admission Decision

↓

12. Admission Approved

↓

13. Fee Payment

↓

14. Student Enrollment

---

# Database Statistics

Total Modules

Core

HR

Admission

CRM

Student

Assessment

Decision

Configuration

Approximate Tables

26

Enums

25+

Triggers

One per audited table

Indexes

Optimized for transactional operations

Normalization

Third Normal Form

Database

PostgreSQL

Primary Keys

UUID

Business Numbers

Generated by backend/service

---

# Future Enhancements

Finance Module

Transport Module

Hostel Module

Library Module

Inventory Module

Attendance Module

Examination Module

AI Analytics

Notification Service

---

# Design Status

Admission Module

Completed

Enums

Completed

Tables

Completed

Indexes

Completed

Triggers

Completed

Workflow Mapping

Completed

Ready for Database Creation

YES
