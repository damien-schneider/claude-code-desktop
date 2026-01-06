# Priority Rules

## High Priority Rules

1. **Always use TypeScript strict mode**
   - Enable strict type checking
   - Avoid `any` types
   - Use proper interfaces and types

2. **Follow naming conventions**
   - Components: PascalCase
   - Functions/variables: camelCase
   - Constants: UPPER_SNAKE_CASE
   - Files: kebab-case

3. **Handle errors gracefully**
   - Use try-catch blocks
   - Provide meaningful error messages
   - Log errors appropriately

4. **Write tests for new features**
   - Unit tests for functions
   - Integration tests for components
   - E2E tests for user flows

## Medium Priority Rules

1. **Keep functions small**
   - Maximum 20 lines per function
   - Single responsibility
   - Use descriptive names

2. **Add JSDoc comments**
   - Document public APIs
   - Describe parameters and return types
   - Include usage examples

3. **Use environment variables**
   - Never hardcode secrets
   - Use `.env` files
   - Document required variables
