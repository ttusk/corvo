# Codebase Refinement Plan - Corvo Plugin

**Date:** 2026-06-11  
**Status:** ✅ All tests passing (23/23)  
**Version:** 0.1.0

This document outlines a comprehensive refinement plan for the Corvo Obsidian plugin based on detailed analysis of the domain, application, infrastructure, and UI layers.

---

## 📊 Executive Summary

### Current State
- **Architecture:** Well-structured hexagonal architecture with clear layer separation
- **Test Coverage:** 23 tests passing across domain, application, and UI
- **Main Strengths:** Clean ports/adapters pattern, dependency injection, type safety
- **Main Concerns:** Anemic domain model, code duplication in use cases, monolithic UI view

### Key Metrics
- **Total Files:** 52 TypeScript files
- **Total Use Cases:** 20 (with ~75% code duplication)
- **Total Commands:** 21
- **UI Tabs:** 7
- **Monolithic View:** 1,259 lines (largest concern)

---

## 🎯 Refinement Priorities

### 🔴 Critical (Do First)

#### 1. Break Up Monolithic CorvoView (1,259 lines)
**Problem:** God object anti-pattern with 7 different UI concerns

**Impact:** 
- Hard to maintain and test
- Low reusability
- Full re-renders on every interaction

**Solution:**
```typescript
// Proposed structure
ui/view/
├── CorvoView.ts                    // Main container (~150 lines)
├── components/
│   ├── DashboardTab.ts
│   ├── ContestsTab.ts
│   ├── CycleTab.ts
│   ├── ItemsTab.ts
│   ├── TopicsTab.ts
│   ├── SessionsTab.ts
│   └── WallTab.ts
├── shared/
│   ├── DomHelpers.ts              // Reusable createElement, createButton
│   ├── FormBuilder.ts
│   └── TableBuilder.ts
└── registerCorvoView.ts
```

**Estimated Effort:** 2-3 days  
**Files to Create:** 10  
**Files to Modify:** 2

---

#### 2. Extract Common Repository Pattern
**Problem:** 75% of use cases duplicate the load → find → validate → update → save pattern

**Current Duplication:**
```typescript
// Repeated in 15 use cases
const data = await this.dataStore.load();
const entity = data.entities.find((e) => e.id === input.id);
if (!entity) throw new Error("Not found");
const updated = { ...entity, /* changes */ };
await this.dataStore.save({
  ...data,
  entities: data.entities.map((e) => e.id === input.id ? updated : e)
});
```

**Solution:**
```typescript
// infrastructure/persistence/EntityRepository.ts
export class EntityRepository<T extends { id: string }> {
  constructor(
    private dataStore: PluginDataStore,
    private entityKey: keyof CorvoPluginData
  ) {}
  
  async findById(id: string): Promise<T> {
    const data = await this.dataStore.load();
    const entity = data[this.entityKey].find(e => e.id === id);
    if (!entity) throw new NotFoundError(this.entityKey, id);
    return entity;
  }
  
  async update(id: string, updater: (entity: T) => T): Promise<T> {
    const data = await this.dataStore.load();
    const index = data[this.entityKey].findIndex(e => e.id === id);
    if (index === -1) throw new NotFoundError(this.entityKey, id);
    
    const updated = updater(data[this.entityKey][index]);
    data[this.entityKey][index] = updated;
    await this.dataStore.save(data);
    return updated;
  }
  
  async create(entity: T): Promise<T> {
    const data = await this.dataStore.load();
    if (data[this.entityKey].some(e => e.id === entity.id)) {
      throw new AlreadyExistsError(this.entityKey, entity.id);
    }
    data[this.entityKey].push(entity);
    await this.dataStore.save(data);
    return entity;
  }
}
```

**Estimated Effort:** 1 day  
**Files to Create:** 1  
**Files to Modify:** 15 use cases

---

#### 3. Create Custom Error Classes
**Problem:** Generic `Error` type makes error handling difficult

**Solution:**
```typescript
// domain/errors/DomainErrors.ts
export class NotFoundError extends Error {
  constructor(entityType: string, id: string) {
    super(`${entityType} "${id}" was not found.`);
    this.name = 'NotFoundError';
  }
}

export class AlreadyExistsError extends Error {
  constructor(entityType: string, id: string) {
    super(`${entityType} "${id}" already exists.`);
    this.name = 'AlreadyExistsError';
  }
}

export class NoActiveContestError extends Error {
  constructor() {
    super("There is no active contest.");
    this.name = 'NoActiveContestError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

**Estimated Effort:** 0.5 day  
**Files to Create:** 1  
**Files to Modify:** 15 use cases

---

#### 4. Remove Redundant FinalizeCurrentCycleUseCase
**Problem:** Thin wrapper with no added value

**Current:**
```typescript
async execute(): Promise<ContestState> {
  return this.advanceCycleUseCase.execute();
}
```

**Solution:** Remove the file and update callers to use `AdvanceCycleUseCase` directly

**Estimated Effort:** 0.5 day  
**Files to Delete:** 1  
**Files to Modify:** 2-3 (callers)

---

### 🟡 High Priority (Do Soon)

#### 5. Transform Domain Entities to Classes with Validation
**Problem:** Anemic domain model - entities are just data bags

**Current:**
```typescript
export interface StudyItem {
  id: string;
  subjectId: string;
  title: string;
  order: number;
  weight?: number;
  questionCount?: number;
  resourceReferences?: ResourceReference[];
}
```

**Solution:**
```typescript
export class StudyItem {
  private constructor(
    public readonly id: string,
    public readonly subjectId: string,
    public readonly title: string,
    private _order: number,
    private _weight?: number,
    private _questionCount?: number,
    private _resourceReferences: ResourceReference[] = []
  ) {}

  static create(params: StudyItemParams): Result<StudyItem, ValidationError> {
    if (!params.id?.trim()) {
      return Result.error(new ValidationError("ID cannot be empty"));
    }
    if (!params.title?.trim()) {
      return Result.error(new ValidationError("Title cannot be empty"));
    }
    if (params.order < 0) {
      return Result.error(new ValidationError("Order cannot be negative"));
    }
    if (params.weight !== undefined && params.weight < 0) {
      return Result.error(new ValidationError("Weight cannot be negative"));
    }
    
    return Result.ok(new StudyItem(
      params.id,
      params.subjectId,
      params.title,
      params.order,
      params.weight,
      params.questionCount,
      params.resourceReferences || []
    ));
  }

  get order(): number { return this._order; }
  get weight(): number | undefined { return this._weight; }
  
  setWeight(weight: number): Result<void, ValidationError> {
    if (weight < 0) {
      return Result.error(new ValidationError("Weight cannot be negative"));
    }
    this._weight = weight;
    return Result.ok(undefined);
  }
  
  addResourceReference(resource: ResourceReference): void {
    if (!this._resourceReferences.some(r => r.id === resource.id)) {
      this._resourceReferences.push(resource);
    }
  }
}
```

**Estimated Effort:** 3-4 days (gradual migration)  
**Files to Modify:** 9 entity files + all use cases

---

#### 6. Extract Active Contest Guard
**Problem:** Active contest validation duplicated in 6 use cases

**Solution:**
```typescript
// application/guards/ActiveContestGuard.ts
export class ActiveContestGuard {
  constructor(private dataStore: PluginDataStore) {}

  async requireActiveContest(): Promise<string> {
    const data = await this.dataStore.load();
    if (!data.activeContestId) {
      throw new NoActiveContestError();
    }
    return data.activeContestId;
  }
  
  async getActiveContestSubjects(): Promise<Subject[]> {
    const data = await this.dataStore.load();
    const activeContestId = await this.requireActiveContest();
    return data.subjects
      .filter(s => s.contestId === activeContestId)
      .sort((a, b) => a.order - b.order);
  }
}
```

**Estimated Effort:** 0.5 day  
**Files to Create:** 1  
**Files to Modify:** 6 use cases

---

#### 7. Add Data Migration/Versioning System
**Problem:** No strategy for schema evolution

**Solution:**
```typescript
// infrastructure/persistence/DataMigrations.ts
export interface VersionedData extends CorvoPluginData {
  schemaVersion: number;
}

export class DataMigrationService {
  private readonly CURRENT_VERSION = 1;
  
  migrate(data: any): CorvoPluginData {
    const version = data.schemaVersion ?? 1;
    let current = data;
    
    if (version < 2) current = this.migrateV1toV2(current);
    if (version < 3) current = this.migrateV2toV3(current);
    
    return { ...current, schemaVersion: this.CURRENT_VERSION };
  }
  
  private migrateV1toV2(data: any): any {
    // Migration logic
    return data;
  }
}

// Update PluginDataStore
async load(): Promise<CorvoPluginData> {
  const storedData = await this.storageAdapter.load();
  if (!storedData) return createDefaultCorvoPluginData();
  
  const migrated = this.migrationService.migrate(storedData);
  return { ...createDefaultCorvoPluginData(), ...migrated };
}
```

**Estimated Effort:** 1 day  
**Files to Create:** 1  
**Files to Modify:** 2

---

#### 8. Extract Generic Cycle Navigation Pattern
**Problem:** Duplicate circular navigation logic in `CycleService`

**Current:**
```typescript
// Appears in getNextActiveSubject and getNextItemId
const currentIndex = collection.findIndex(...);
if (currentIndex === -1) return collection[0];
return collection[(currentIndex + 1) % collection.length];
```

**Solution:**
```typescript
// domain/services/CycleService.ts
private getNextInCycle<T>(
  items: T[],
  currentItem: T | undefined,
  idGetter: (item: T) => string
): T | null {
  if (items.length === 0) return null;
  if (!currentItem) return items[0];
  
  const currentIndex = items.findIndex(item => 
    idGetter(item) === idGetter(currentItem)
  );
  if (currentIndex === -1) return items[0];
  
  return items[(currentIndex + 1) % items.length];
}

getNextActiveSubject(subjects: Subject[], currentSubjectId?: string): Subject | null {
  const activeSubjects = subjects
    .filter(s => s.isActive)
    .sort((a, b) => a.order - b.order);
  
  const current = currentSubjectId 
    ? activeSubjects.find(s => s.id === currentSubjectId)
    : undefined;
    
  return this.getNextInCycle(activeSubjects, current, s => s.id);
}
```

**Estimated Effort:** 0.5 day  
**Files to Modify:** 1

---

### 🟢 Medium Priority (Do Later)

#### 9. Optimize UI Rendering (Incremental Updates)
**Problem:** Full DOM re-render on every interaction

**Solution:**
```typescript
// ui/view/CorvoView.ts
private shell?: HTMLElement;
private activeTabContainer?: HTMLElement;

async render() {
  if (!this.shell) {
    this.buildShell(); // One-time setup
  }
  
  await this.updateActiveTab(); // Only update changed content
}

private buildShell() {
  // Create header, tabs, container once
  this.shell = this.contentEl.createDiv({ cls: "corvo-view" });
  // ... build static structure
  this.activeTabContainer = this.shell.createDiv({ cls: "corvo-content" });
}

private async updateActiveTab() {
  if (this.activeTabContainer) {
    this.activeTabContainer.innerHTML = "";
    await this.renderActiveTab(this.activeTabContainer, await this.dataStore.load());
  }
}
```

**Estimated Effort:** 1 day  
**Files to Modify:** 1

---

#### 10. Add Input Validation Layer
**Problem:** Input validation scattered across use cases

**Solution:**
```typescript
// application/validation/InputValidators.ts
export class CreateStudyItemValidator {
  validate(input: CreateStudyItemInput): ValidationResult {
    const errors: string[] = [];
    
    if (!input.id?.trim()) errors.push("ID is required");
    if (!input.title?.trim()) errors.push("Title is required");
    if (input.order < 0) errors.push("Order cannot be negative");
    if (input.weight !== undefined && input.weight < 0) {
      errors.push("Weight cannot be negative");
    }
    
    return errors.length > 0
      ? { valid: false, errors }
      : { valid: true };
  }
}

// Usage in use case
async execute(input: CreateStudyItemInput): Promise<StudyItem> {
  const validation = new CreateStudyItemValidator().validate(input);
  if (!validation.valid) {
    throw new ValidationError(validation.errors.join(", "));
  }
  // ... rest of logic
}
```

**Estimated Effort:** 2 days  
**Files to Create:** 5-10 validators  
**Files to Modify:** 15 use cases

---

#### 11. Create Domain Services for Entity Operations
**Problem:** No centralized logic for managing entity relationships

**Solution:**
```typescript
// domain/services/SubjectService.ts
export class SubjectService {
  addStudyItem(subject: Subject, item: StudyItem): Result<Subject, DomainError> {
    if (item.subjectId !== subject.id) {
      return Result.error(new DomainError("Item does not belong to this subject"));
    }
    
    if (subject.itemIds.includes(item.id)) {
      return Result.error(new DomainError("Item already exists in subject"));
    }
    
    return Result.ok({
      ...subject,
      itemIds: [...subject.itemIds, item.id]
    });
  }
  
  removeStudyItem(subject: Subject, itemId: string): Result<Subject, DomainError> {
    if (!subject.itemIds.includes(itemId)) {
      return Result.error(new DomainError("Item not found in subject"));
    }
    
    return Result.ok({
      ...subject,
      itemIds: subject.itemIds.filter(id => id !== itemId)
    });
  }
}
```

**Estimated Effort:** 2 days  
**Files to Create:** 3-5 services  
**Files to Modify:** Multiple use cases

---

#### 12. Fix Dependency Injection in AdvanceCycleUseCase
**Problem:** Direct service instantiation breaks DI pattern

**Current:**
```typescript
private readonly cycleService = new CycleService()
```

**Solution:**
```typescript
constructor(
  private readonly dataStore: PluginDataStore,
  private readonly cycleService: CycleService = new CycleService()
) {}
```

**Estimated Effort:** 0.25 day  
**Files to Modify:** 2

---

### 🔵 Low Priority (Nice to Have)

#### 13. Add JSDoc Documentation
**Solution:** Document complex use cases and domain logic

**Estimated Effort:** 1 day  
**Files to Modify:** 20-30

---

#### 14. Extract Constants
**Solution:**
```typescript
// ui/constants.ts
export const ICON_PATHS = { /* ... */ };
export const TABS = [ /* ... */ ];
export const DATE_FORMAT = "dd/MM/yyyy";
```

**Estimated Effort:** 0.5 day  
**Files to Create:** 1-2  
**Files to Modify:** 3-5

---

#### 15. Add Result Type for Better Error Handling
**Solution:**
```typescript
// domain/types/Result.ts
export type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

export const Result = {
  ok<T>(value: T): Result<T, never> {
    return { success: true, value };
  },
  error<E>(error: E): Result<never, E> {
    return { success: false, error };
  }
};

// Usage
async execute(input: CreateStudyItemInput): Promise<Result<StudyItem>> {
  // ...
}
```

**Estimated Effort:** 2-3 days (gradual migration)  
**Files to Create:** 1  
**Files to Modify:** All use cases

---

## 📅 Suggested Implementation Timeline

### Week 1: Foundation
- Day 1-2: Create custom error classes (#3)
- Day 3: Extract EntityRepository pattern (#2)
- Day 4: Remove redundant use case (#4)
- Day 5: Extract ActiveContestGuard (#6)

### Week 2: UI Refactoring
- Day 1-3: Break up CorvoView into components (#1)
- Day 4: Optimize rendering (#9)
- Day 5: Testing and validation

### Week 3: Domain Enhancement
- Day 1-2: Extract cycle navigation pattern (#8)
- Day 3-5: Begin entity class transformation (#5)

### Week 4: Infrastructure & Validation
- Day 1: Add data migration system (#7)
- Day 2-3: Add input validation layer (#10)
- Day 4-5: Testing and documentation

---

## 🧪 Testing Strategy

### Before Any Refactoring
```bash
npm test  # Ensure all 23 tests pass
```

### During Refactoring
1. Run tests after each change
2. Add new tests for new abstractions (repositories, guards)
3. Maintain or improve test coverage

### After Refactoring
1. Full test suite must pass
2. Manual testing of UI in Obsidian
3. Performance testing for rendering improvements

---

## 📝 Migration Checklist

For each refactoring task:

- [ ] Create new files/classes
- [ ] Write unit tests for new code
- [ ] Update existing code to use new abstractions
- [ ] Run full test suite
- [ ] Update documentation
- [ ] Review and commit changes

---

## 🎯 Success Metrics

### Code Quality
- [ ] Reduce CorvoView from 1,259 to <200 lines
- [ ] Reduce use case code duplication from 75% to <20%
- [ ] Introduce proper error types (0 → 4+)
- [ ] Add domain validation (0 → comprehensive)

### Maintainability
- [ ] Easier to add new features
- [ ] Easier to test individual components
- [ ] Better code navigation
- [ ] Clear separation of concerns

### Performance
- [ ] Faster UI updates (incremental vs full re-render)
- [ ] No noticeable performance degradation

---

## 🚀 Next Steps

1. **Review this plan** with the team
2. **Prioritize** which improvements to tackle first
3. **Create branches** for each major refactoring
4. **Test thoroughly** at each step
5. **Document decisions** and learnings

---

## 📚 Additional Resources

- **Current Architecture:** Well-structured hexagonal architecture
- **Testing:** 23 tests passing (vitest)
- **Tech Stack:** TypeScript, Obsidian API, esbuild
- **File Count:** 52 TypeScript files

---

**Last Updated:** 2026-06-11  
**Next Review:** After Week 1 completion
