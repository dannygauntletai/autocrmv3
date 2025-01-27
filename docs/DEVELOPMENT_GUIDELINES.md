# Development Guidelines

## Database & Schema Management

### 1. Schema Changes
- **Single Source of Truth**: Always refer to database type definitions (e.g., `database.types.ts`) before making schema assumptions
- **Migration Dependencies**: When modifying tables, check for:
  - Foreign key relationships
  - RLS policies that reference the tables
  - Storage bucket policies that depend on the tables
  - Views or functions that use the tables
  - Edge functions that interact with the tables

### 2. Database Functions & Triggers
- **Function Management**:
  - Check existing migrations for similar functions before creating new ones
  - Verify extension availability before using extension-provided functions
  - Use consistent naming across all functions and triggers
  - Document function dependencies and side effects
- **Trigger Patterns**:
  - Maintain consistent trigger naming (e.g., `update_[table]_[column]`)
  - Use standard patterns for common operations (timestamps, auditing)
  - Consider trigger execution order when multiple triggers exist
  - Document trigger behavior and potential cascading effects

### 3. Role-Based Access Control (RBAC)
- **Role Storage**: 
  - Clearly document where user roles are stored (e.g., in a users/employees table vs. junction tables)
  - Don't mix role-based logic between different tables
- **Policy Updates**: When modifying role-based logic:
  - Update all related RLS policies
  - Check storage bucket policies
  - Review edge function permissions
  - Update UI components that depend on roles

## Error Handling & Debugging

### 1. HTTP Error Analysis
- For 400 (Bad Request):
  - Check request payload structure
  - Verify all required fields are present
  - Validate data types match schema
- For 500 (Server Error):
  - Check server logs
  - Verify database queries
  - Review edge function logs
  - Check for environment variable issues

### 2. Database Errors
- Common causes to check:
  - Schema mismatches
  - Missing or incorrect foreign keys
  - RLS policy conflicts
  - Type mismatches
  - Missing indexes for frequent queries

## Component Development

### 1. Data Access
- **Query Optimization**:
  - Use joins instead of multiple separate queries
  - Include necessary indexes for frequent queries
  - Consider query performance impact on RLS
- **State Management**:
  - Clear loading states
  - Comprehensive error handling
  - Proper cleanup in useEffect hooks

### 2. Security Considerations
- **RLS Policies**:
  - Write policies for each operation (select, insert, update, delete)
  - Test policies with different user roles
  - Document policy dependencies
- **File Access**:
  - Implement proper bucket policies
  - Handle file size limits
  - Consider file type restrictions

## Testing & Validation

### 1. Schema Changes
- Test migrations:
  - Forward migration
  - Rollback scenarios
  - Data preservation
  - Foreign key constraints
- Verify RLS policies:
  - All CRUD operations
  - Different user roles
  - Edge cases

### 2. Component Changes
- Test with:
  - Different user roles
  - Various data states
  - Error scenarios
  - Loading states
  - Edge cases

## Documentation

### 1. Code Documentation
- Document:
  - Schema relationships
  - RLS policy logic
  - Component dependencies
  - Environment variables
  - API endpoints

### 2. Change Documentation
- For each change:
  - Document the reason
  - List affected components
  - Note potential side effects
  - Include rollback procedures

## Best Practices

### 1. Code Organization
- Keep related code together
- Use consistent naming conventions
- Follow type safety principles
- Maintain clear file structure

### 2. Performance
- Monitor query performance
- Use appropriate indexes
- Implement caching where needed
- Optimize API calls

### 3. Security
- Follow least privilege principle
- Regularly review RLS policies
- Validate all user input
- Protect sensitive data

## Common Pitfalls to Avoid

1. Making schema assumptions without checking types
2. Mixing role logic between tables
3. Incomplete policy updates when changing schemas
4. Missing foreign key constraints
5. Inadequate error handling
6. Insufficient logging
7. Incomplete testing across user roles
8. Poor documentation of dependencies

Remember: Changes rarely exist in isolation. Always consider the full stack impact of any modification. 