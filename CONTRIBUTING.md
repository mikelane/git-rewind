# Contributing to Git Rewind

Thanks for your interest in contributing to Git Rewind! This document outlines how to get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env.local` and configure (see README)
4. Run development server: `pnpm dev`

## Development Workflow

### Test-Driven Development (TDD)

We follow strict TDD practices:

1. **Write a failing test first** - No production code without a failing test
2. **Write minimal code to pass** - Only enough to make the test green
3. **Refactor** - Clean up while keeping tests green

```
RED → GREEN → REFACTOR (repeat)
```

### Running Tests

```bash
pnpm test          # Watch mode
pnpm test:run      # Single run
pnpm test:coverage # With coverage
```

### Code Quality

Before submitting a PR, ensure:

```bash
pnpm lint       # No ESLint errors
pnpm typecheck  # No TypeScript errors
pnpm test:run   # All tests pass
pnpm build      # Production build succeeds
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following TDD
3. Ensure all checks pass
4. Submit a PR with a clear description
5. Address any review feedback

### PR Title Format

Use conventional commits:

- `feat: Add new feature`
- `fix: Fix bug description`
- `docs: Update documentation`
- `refactor: Refactor code`
- `test: Add tests`
- `chore: Update dependencies`

## Reporting Bugs

Open an issue with:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## Requesting Features

Open an issue describing:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## Code Style

- TypeScript strict mode
- No `any` types
- Meaningful variable names
- Comments for complex logic only

## Questions?

Open an issue or reach out to the maintainers.

Thank you for contributing!
