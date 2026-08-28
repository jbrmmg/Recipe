import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MealCookComponent } from './meal-cook.component';
import { MealService } from '../../../services/meal.service';
import { RecipeService } from '../../../services/recipe.service';
import { RecipeDetail } from '../../../models/recipe.model';
import { MealDetail } from '../../../models/meal.model';

// ── helpers ───────────────────────────────────────────────────────────────────

const makeBlock = (key: string, durationSeconds: number, absoluteStart = 0) => ({
  key,
  absoluteStart,
  durationSeconds,
  steps: [{ phase: 'COOK' as const, stepOrder: 1, description: 'step', durationSeconds, timerRequired: false }],
  isParallelGroup: false,
});

const makeGanttRecipe = (recipeId: number, startOffset: number, blocks: ReturnType<typeof makeBlock>[]) => ({
  recipeId,
  title: `Recipe ${recipeId}`,
  color: { bg: '#e3f2fd', text: '#1565c0' },
  startOffset,
  totalDuration: blocks.reduce((s, b) => s + b.durationSeconds, 0),
  blocks,
});

const mockMeal: MealDetail = { id: 1, name: 'Test Meal', recipes: [] };

const mockRecipeDetail = (id: number, steps: RecipeDetail['steps'] = []): RecipeDetail => ({
  id,
  title: `Recipe ${id}`,
  baseServings: 2,
  ingredients: [],
  tags: [],
  steps,
  createdDate: '2024-01-01T00:00:00',
  lastModifiedDate: '2024-01-01T00:00:00',
});

// ── suite ─────────────────────────────────────────────────────────────────────

describe('MealCookComponent', () => {
  let component: MealCookComponent;
  let fixture: ComponentFixture<MealCookComponent>;

  beforeEach(async () => {
    const mealSpy    = jasmine.createSpyObj<MealService>('MealService', ['getById']);
    const recipeSpy  = jasmine.createSpyObj<RecipeService>('RecipeService', ['getById']);
    const routerSpy  = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const snackSpy   = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    mealSpy.getById.and.returnValue(of(mockMeal));
    recipeSpy.getById.and.returnValue(of(mockRecipeDetail(10)));

    await TestBed.configureTestingModule({
      imports: [MealCookComponent],
      providers: [
        { provide: MealService,    useValue: mealSpy },
        { provide: RecipeService,  useValue: recipeSpy },
        { provide: Router,         useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
        { provide: MatSnackBar,    useValue: snackSpy },
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(MealCookComponent);
    component = fixture.componentInstance;
    // Deliberately NOT calling detectChanges — ngOnInit does not run,
    // allowing signals to be configured manually for each test group.
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  // ── creation ──────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initial screen is setup', () => {
    expect(component.screen()).toBe('setup');
  });

  it('initial tab is prep', () => {
    expect(component.activeTab()).toBe('prep');
  });

  // ── prep checklist ────────────────────────────────────────────────────────

  describe('prep checklist', () => {
    it('isPrepChecked returns false for an untouched step', () => {
      expect(component.isPrepChecked('step-1')).toBeFalse();
    });

    it('togglePrep marks an unchecked step as checked', () => {
      component.togglePrep('step-1');
      expect(component.isPrepChecked('step-1')).toBeTrue();
    });

    it('togglePrep unmarks an already-checked step', () => {
      component.togglePrep('step-1');
      component.togglePrep('step-1');
      expect(component.isPrepChecked('step-1')).toBeFalse();
    });

    it('toggling one step does not affect another', () => {
      component.togglePrep('step-1');
      expect(component.isPrepChecked('step-2')).toBeFalse();
    });

    it('multiple independent steps can all be checked', () => {
      ['a', 'b', 'c'].forEach(k => component.togglePrep(k));
      ['a', 'b', 'c'].forEach(k => expect(component.isPrepChecked(k)).toBeTrue());
    });
  });

  // ── startCooking ──────────────────────────────────────────────────────────

  describe('startCooking', () => {
    it('sets cookingStarted to true', () => {
      component.startCooking();
      expect(component.cookingStarted()).toBeTrue();
    });

    it('is idempotent — second call does not reset the start time', () => {
      component.startCooking();
      const first = component.cookStartTime();
      component.startCooking();
      expect(component.cookStartTime()).toBe(first);
    });
  });

  // ── timer: tapBlock ───────────────────────────────────────────────────────

  describe('tapBlock', () => {
    it('starts a timer and adds the key to runningKeys', fakeAsync(() => {
      const block = makeBlock('b1', 120);
      component.tapBlock(block as any);

      expect(component.runningKeys().has('b1')).toBeTrue();
      expect(component.blockTimers().get('b1')?.remaining).toBe(120);
      discardPeriodicTasks();
    }));

    it('initialises remaining from block durationSeconds', fakeAsync(() => {
      const block = makeBlock('b1', 90);
      component.tapBlock(block as any);

      expect(component.blockTimers().get('b1')?.initialDuration).toBe(90);
      discardPeriodicTasks();
    }));

    it('decrements remaining by 1 each second', fakeAsync(() => {
      const block = makeBlock('b1', 120);
      component.tapBlock(block as any);

      tick(3000);
      expect(component.blockTimers().get('b1')?.remaining).toBe(117);
      discardPeriodicTasks();
    }));

    it('pauses a running timer when tapped a second time', fakeAsync(() => {
      const block = makeBlock('b1', 120);
      component.tapBlock(block as any);
      tick(2000);
      component.tapBlock(block as any); // second tap = pause

      expect(component.runningKeys().has('b1')).toBeFalse();
      expect(component.blockTimers().get('b1')?.remaining).toBe(118);
    }));

    it('preserves remaining when paused via second tap', fakeAsync(() => {
      const block = makeBlock('b1', 60);
      component.tapBlock(block as any);
      tick(10000);
      component.tapBlock(block as any); // pause at 50s remaining

      tick(5000); // extra time — should not decrement while paused
      expect(component.blockTimers().get('b1')?.remaining).toBe(50);
    }));

    it('ignores blocks with zero duration', () => {
      const block = makeBlock('b0', 0);
      component.tapBlock(block as any);
      expect(component.runningKeys().has('b0')).toBeFalse();
    });

    it('marks a block as done and removes from runningKeys when it reaches zero', fakeAsync(() => {
      const block = makeBlock('b1', 3);
      component.tapBlock(block as any);

      tick(3000);
      expect(component.blockTimers().get('b1')?.done).toBeTrue();
      expect(component.runningKeys().has('b1')).toBeFalse();
    }));
  });

  // ── timer: concurrent timers ──────────────────────────────────────────────

  describe('concurrent timers', () => {
    it('two blocks count down independently', fakeAsync(() => {
      const b1 = makeBlock('b1', 60);
      const b2 = makeBlock('b2', 120);
      component.tapBlock(b1 as any);
      component.tapBlock(b2 as any);

      tick(5000);
      expect(component.blockTimers().get('b1')?.remaining).toBe(55);
      expect(component.blockTimers().get('b2')?.remaining).toBe(115);
      discardPeriodicTasks();
    }));

    it('pausing one timer does not affect the other', fakeAsync(() => {
      const b1 = makeBlock('b1', 60);
      const b2 = makeBlock('b2', 120);
      component.tapBlock(b1 as any);
      component.tapBlock(b2 as any);
      tick(3000);
      component.pauseTimer('b1');

      tick(4000); // only b2 keeps running
      expect(component.blockTimers().get('b1')?.remaining).toBe(57); // frozen at pause
      expect(component.blockTimers().get('b2')?.remaining).toBe(113); // 120 - 7
      discardPeriodicTasks();
    }));

    it('runningKeys tracks all concurrently-running blocks', fakeAsync(() => {
      const b1 = makeBlock('b1', 60);
      const b2 = makeBlock('b2', 60);
      const b3 = makeBlock('b3', 60);
      component.tapBlock(b1 as any);
      component.tapBlock(b2 as any);
      component.tapBlock(b3 as any);

      expect(component.runningKeys().size).toBe(3);
      discardPeriodicTasks();
    }));
  });

  // ── timer: pauseTimer / resumeTimer / resetBlockTimer ────────────────────

  describe('pauseTimer', () => {
    it('stops the countdown and removes from runningKeys', fakeAsync(() => {
      const block = makeBlock('b1', 120);
      component.tapBlock(block as any);
      tick(5000);
      component.pauseTimer('b1');

      expect(component.runningKeys().has('b1')).toBeFalse();
      expect(component.blockTimers().get('b1')?.remaining).toBe(115);
    }));

    it('is a no-op if the key is not running', () => {
      expect(() => component.pauseTimer('no-such-key')).not.toThrow();
    });
  });

  describe('resumeTimer', () => {
    it('resumes countdown from the saved remaining value', fakeAsync(() => {
      const block = makeBlock('b1', 120);
      component.tapBlock(block as any);
      tick(5000);           // remaining = 115
      component.pauseTimer('b1');
      component.resumeTimer('b1');

      tick(3000);           // remaining = 112
      expect(component.blockTimers().get('b1')?.remaining).toBe(112);
      discardPeriodicTasks();
    }));

    it('adds the key back to runningKeys', fakeAsync(() => {
      const block = makeBlock('b1', 120);
      component.tapBlock(block as any);
      component.pauseTimer('b1');
      component.resumeTimer('b1');

      expect(component.runningKeys().has('b1')).toBeTrue();
      discardPeriodicTasks();
    }));

    it('is a no-op if the timer is already running', fakeAsync(() => {
      const block = makeBlock('b1', 120);
      component.tapBlock(block as any);
      component.resumeTimer('b1'); // already running — should not error or duplicate

      expect(component.runningKeys().size).toBe(1);
      discardPeriodicTasks();
    }));
  });

  describe('resetBlockTimer', () => {
    it('removes state from blockTimers', fakeAsync(() => {
      const block = makeBlock('b1', 120);
      component.tapBlock(block as any);
      tick(3000);
      component.resetBlockTimer('b1');

      expect(component.blockTimers().has('b1')).toBeFalse();
    }));

    it('removes key from runningKeys', fakeAsync(() => {
      const block = makeBlock('b1', 120);
      component.tapBlock(block as any);
      component.resetBlockTimer('b1');

      expect(component.runningKeys().has('b1')).toBeFalse();
    }));

    it('is a no-op if the block has never been timed', () => {
      expect(() => component.resetBlockTimer('nonexistent')).not.toThrow();
    });
  });

  // ── blockTimerDisplay ─────────────────────────────────────────────────────

  describe('blockTimerDisplay', () => {
    it('returns empty string when no timer state exists', () => {
      expect(component.blockTimerDisplay('no-key')).toBe('');
    });

    it('returns MM:SS for a fresh timer (2 min 5 sec)', fakeAsync(() => {
      const block = makeBlock('b1', 125);
      component.tapBlock(block as any);
      discardPeriodicTasks();

      expect(component.blockTimerDisplay('b1')).toBe('02:05');
    }));

    it('zero-pads single-digit seconds', fakeAsync(() => {
      const block = makeBlock('b1', 69); // 1m 9s
      component.tapBlock(block as any);
      discardPeriodicTasks();

      expect(component.blockTimerDisplay('b1')).toBe('01:09');
    }));

    it('shows 00:00 for a done timer', fakeAsync(() => {
      const block = makeBlock('b1', 2);
      component.tapBlock(block as any);
      tick(2000);

      expect(component.blockTimerDisplay('b1')).toBe('00:00');
    }));
  });

  // ── formatDuration ────────────────────────────────────────────────────────

  describe('formatDuration', () => {
    it('returns empty string for 0 seconds', () => {
      expect(component.formatDuration(0)).toBe('');
    });

    it('returns seconds-only for sub-minute durations', () => {
      expect(component.formatDuration(45)).toBe('45s');
    });

    it('returns minutes-only for exact minute multiples', () => {
      expect(component.formatDuration(120)).toBe('2m');
    });

    it('returns minutes and seconds for non-exact durations', () => {
      expect(component.formatDuration(150)).toBe('2m 30s');
    });

    it('returns single minute correctly', () => {
      expect(component.formatDuration(60)).toBe('1m');
    });

    it('returns single second correctly', () => {
      expect(component.formatDuration(1)).toBe('1s');
    });
  });

  // ── gantt geometry ────────────────────────────────────────────────────────

  describe('gantt geometry (no recipes loaded — ganttScale defaults to 2)', () => {
    it('ganttScale returns 2 when there are no cook steps', () => {
      expect(component.ganttScale()).toBe(2);
    });

    it('blockTop returns absoluteStart × ganttScale', () => {
      const block = makeBlock('b1', 60, 30);
      expect(component.blockTop(block as any)).toBe(30 * 2);
    });

    it('blockHeight returns durationSeconds × ganttScale', () => {
      const block = makeBlock('b1', 90);
      expect(component.blockHeight(block as any)).toBe(90 * 2);
    });

    it('waitHeight returns offsetSeconds × ganttScale', () => {
      expect(component.waitHeight(45)).toBe(45 * 2);
    });

    it('colBodyHeight is at least 100px', () => {
      expect(component.colBodyHeight()).toBeGreaterThanOrEqual(100);
    });

    it('visualBlockTop with isStarted=false matches blockTop', () => {
      const block  = makeBlock('b1', 60, 60);
      const recipe = makeGanttRecipe(1, 30, [block]);
      expect(component.visualBlockTop(block as any, recipe as any, false))
        .toBe(component.blockTop(block as any));
    });

    it('visualBlockTop with isStarted=true shifts block up by startOffset', () => {
      const block  = makeBlock('b1', 60, 90); // absoluteStart already includes startOffset
      const recipe = makeGanttRecipe(1, 90, [block]);
      const scale  = component.ganttScale();
      expect(component.visualBlockTop(block as any, recipe as any, true))
        .toBe((90 - 90) * scale); // = 0
    });

    it('visualBlockTop with isStarted=true and no offset is same as blockTop', () => {
      const block  = makeBlock('b1', 60, 0);
      const recipe = makeGanttRecipe(1, 0, [block]);
      expect(component.visualBlockTop(block as any, recipe as any, true))
        .toBe(component.blockTop(block as any));
    });

    it('earlyGapTop equals totalDuration × ganttScale', () => {
      const block  = makeBlock('b1', 120, 60);
      const recipe = makeGanttRecipe(1, 60, [block]); // totalDuration = 120
      expect(component.earlyGapTop(recipe as any)).toBe(120 * 2);
    });
  });

  // ── startedRecipeIds ──────────────────────────────────────────────────────

  describe('startedRecipeIds', () => {
    it('is empty when no timers have been started', () => {
      component.meal.set(mockMeal);
      component.recipes.set([mockRecipeDetail(10)]);
      expect(component.startedRecipeIds().size).toBe(0);
    });

    it('contains the recipe id once any of its blocks is timed', fakeAsync(() => {
      component.meal.set(mockMeal);
      component.recipes.set([mockRecipeDetail(10, [
        { phase: 'COOK', stepOrder: 1, description: 'Fry', durationSeconds: 300, timerRequired: false },
      ])]);

      const ganttR = component.ganttRecipes()[0];
      component.tapBlock(ganttR.blocks[0]);

      expect(component.startedRecipeIds().has(10)).toBeTrue();
      discardPeriodicTasks();
    }));

    it('does not include recipes whose blocks have not been timed', fakeAsync(() => {
      component.meal.set(mockMeal);
      component.recipes.set([
        mockRecipeDetail(10, [{ phase: 'COOK', stepOrder: 1, description: 'A', durationSeconds: 120, timerRequired: false }]),
        mockRecipeDetail(20, [{ phase: 'COOK', stepOrder: 1, description: 'B', durationSeconds: 180, timerRequired: false }]),
      ]);

      const ganttR = component.ganttRecipes()[0]; // first recipe
      component.tapBlock(ganttR.blocks[0]);

      expect(component.startedRecipeIds().has(10)).toBeTrue();
      expect(component.startedRecipeIds().has(20)).toBeFalse();
      discardPeriodicTasks();
    }));
  });

  // ── getColumnTimer ────────────────────────────────────────────────────────

  describe('getColumnTimer', () => {
    it('returns null when no blocks have timers', () => {
      const recipe = makeGanttRecipe(1, 0, [makeBlock('b1', 60)]);
      expect(component.getColumnTimer(recipe as any)).toBeNull();
    });

    it('returns the running timer when a block is running', fakeAsync(() => {
      const block  = makeBlock('b1', 60);
      const recipe = makeGanttRecipe(1, 0, [block]);
      component.tapBlock(block as any);

      const result = component.getColumnTimer(recipe as any);
      expect(result?.key).toBe('b1');
      expect(result?.running).toBeTrue();
      discardPeriodicTasks();
    }));

    it('returns paused timer info when the block is paused', fakeAsync(() => {
      const block  = makeBlock('b1', 60);
      const recipe = makeGanttRecipe(1, 0, [block]);
      component.tapBlock(block as any);
      component.pauseTimer('b1');

      const result = component.getColumnTimer(recipe as any);
      expect(result?.key).toBe('b1');
      expect(result?.running).toBeFalse();
    }));

    it('returns null for a completed (done) timer', fakeAsync(() => {
      const block  = makeBlock('b1', 2);
      const recipe = makeGanttRecipe(1, 0, [block]);
      component.tapBlock(block as any);
      tick(2000);

      expect(component.getColumnTimer(recipe as any)).toBeNull();
    }));

    it('prefers a running timer over a paused one', fakeAsync(() => {
      const b1 = makeBlock('b1', 120);
      const b2 = makeBlock('b2', 60);
      const recipe = makeGanttRecipe(1, 0, [b1, b2]);

      component.tapBlock(b1 as any);
      component.tapBlock(b2 as any);
      component.pauseTimer('b1'); // b1 paused, b2 running

      expect(component.getColumnTimer(recipe as any)?.key).toBe('b2');
      discardPeriodicTasks();
    }));

    it('returns null when all timers in the recipe are done', fakeAsync(() => {
      const b1 = makeBlock('b1', 1);
      const b2 = makeBlock('b2', 1);
      const recipe = makeGanttRecipe(1, 0, [b1, b2]);

      component.tapBlock(b1 as any);
      component.tapBlock(b2 as any);
      tick(1000); // both complete

      expect(component.getColumnTimer(recipe as any)).toBeNull();
    }));
  });

  // ── prepOutstanding ───────────────────────────────────────────────────────

  describe('prepOutstanding', () => {
    it('counts unchecked prep steps across all groups', () => {
      component.meal.set(mockMeal);
      component.recipes.set([mockRecipeDetail(10, [
        { phase: 'PREP', stepOrder: 1, description: 'Chop', durationSeconds: 0, timerRequired: false },
        { phase: 'PREP', stepOrder: 2, description: 'Slice', durationSeconds: 0, timerRequired: false },
      ])]);

      expect(component.prepOutstanding()).toBe(2);
    });

    it('decreases as prep steps are checked', () => {
      component.meal.set(mockMeal);
      component.recipes.set([mockRecipeDetail(10, [
        { phase: 'PREP', stepOrder: 1, description: 'Chop', durationSeconds: 0, timerRequired: false },
        { phase: 'PREP', stepOrder: 2, description: 'Slice', durationSeconds: 0, timerRequired: false },
      ])]);

      const group = component.prepGroups()[0];
      component.togglePrep(group.steps[0].key);

      expect(component.prepOutstanding()).toBe(1);
    });
  });
});
