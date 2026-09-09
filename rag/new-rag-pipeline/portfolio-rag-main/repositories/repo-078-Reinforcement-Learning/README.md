# Repository 078 — Reinforcement-Learning

## Repository Identity

- **Repository:** `kirolossedra/Reinforcement-Learning`
- **Repository start date:** 2025-03-13
- **Last meaningful update date:** 2025-03-14
- **Latest meaningful commit:** `1031e192c58a429e8a732053b80fa63ec1583abb`
- **Primary technical field:** reinforcement-learning experimentation
- **Application domain:** learning projectile-control policy inside a basketball game simulation
- **Primary technologies:** Python, Pygame, tabular Q-learning
- **Project context:** personal experimental learning project
- **Collaboration classification:** `individual-project`

## Evidence Basis

The repository contains a compact progression of five substantial Python files:

- `basicgame.py`,
- `q1.py`,
- `q2.py`,
- `q3.py`,
- `q4.py`.

The commit history mirrors that progression.

All five implementation commits were created within a short experimental session spanning March 13–14, 2025.

This matters because the repository is best understood as a sequence of controlled implementation variants rather than a long-lived deployed product.

The root README contains only a short title.

The implementation files are therefore the authoritative evidence.

## What the Project Is

The repository begins with a hand-built Pygame basketball simulation.

It then repeatedly augments that environment with tabular Q-learning.

The learning task is to select a projectile arc that can cause the ball to enter the basket.

Across the variants, the state representation and learning strategy become progressively richer.

The project therefore combines:

- game-loop programming,
- projectile physics,
- reward-driven control,
- discrete state construction,
- epsilon-greedy exploration,
- Q-value updates,
- experience replay in the final version.

It is not a neural-network reinforcement-learning project.

No DQN is implemented.

The learning mechanism remains tabular Q-learning.

## Experimental Progression

The repository structure itself communicates the experiment:

```text
basicgame.py
    ↓
q1.py
    ↓
q2.py
    ↓
q3.py
    ↓
q4.py
```

Each later file carries forward the game while modifying the agent.

That gives unusually clear evidence of iterative model design.

## Baseline Environment — `basicgame.py`

The baseline file implements a Pygame application called `BasketBallfellow`.

It creates:

- a player,
- a basketball,
- a basket,
- a scoreboard,
- a court,
- celebration effects.

The player can:

- move horizontally,
- jump,
- shoot.

The projectile arc is adjustable.

The ball follows simple discrete-time projectile motion with:

- horizontal velocity,
- vertical velocity,
- gravity.

The game detects whether the ball enters the basket-rim region.

It also handles missed/out-of-bounds shots.

## Game Physics

The ball state is updated with:

```text
x += velocity_x
y += velocity_y
velocity_y += gravity
```

The basket test calculates Euclidean distance between the ball center and rim center.

A score is recorded when the distance is inside the configured rim radius.

This creates a deterministic-enough environment for an agent to learn action choices while still retaining changing player position.

## Game Loop and Interaction

The Pygame loop runs at a configured 60 FPS.

The baseline includes:

- keyboard input,
- jumping state,
- projectile state,
- score updates,
- object drawing,
- particle celebration,
- day/evening/night court themes.

The code also creates placeholder images when expected sprite files are absent.

That is a practical fallback mechanism that allows the program to remain runnable without its original art assets.

## Q1 — First Tabular Q-Learning Agent

`q1.py` introduces a `QLearningAgent`.

### State

The player's horizontal position is discretized into bins.

Default:

```text
state_bins = 10
```

The continuous player coordinate is normalized and mapped to one of those discrete states.

### Action Space

Actions are integer projectile-arc values:

```text
5..30
```

The agent therefore learns a discrete shooting-arc policy.

### Q Table

The table is represented as a Python dictionary.

Each state maps to an array of Q-values, one per action.

Unseen states are lazily initialized.

### Exploration

The first agent uses epsilon-greedy action selection.

With probability epsilon it chooses a random action.

Otherwise it chooses one of the actions with maximum Q-value.

Ties are randomly resolved.

### Update Rule

The implementation uses the standard tabular Q-learning update:

```text
Q(s,a) ← Q(s,a)
         + α [r + γ max Q(s',·) - Q(s,a)]
```

The defaults are:

- alpha = 0.1,
- gamma = 0.9,
- epsilon = 0.1.

## Agent-Environment Integration

The learning agent is integrated into the live game loop.

Every two seconds, when the player holds the ball:

1. the agent derives the current state,
2. selects a projectile arc,
3. shoots,
4. stores the originating state and action on that ball.

When the shot ends:

- a successful score receives positive reward,
- a miss receives negative reward,
- the Q-table is updated.

This is an important systems element.

The RL logic is not isolated in a toy matrix.

It controls an action inside the Pygame environment.

## Q2 — Landing-Position State Augmentation

`q2.py` expands the state representation.

Instead of using only player position, the state becomes:

```text
(player_position_bin, ball_final_position_bin)
```

The ball records its final horizontal position.

This adds outcome context to the agent state.

The change demonstrates a core RL design concept:

> what information is included in the state can materially affect learnability.

The project experiments with this explicitly rather than leaving state definition fixed.

## Q3 — Physics-Informed Predicted Drop

`q3.py` changes the state representation again.

It adds a helper that estimates where the projectile will reach ground level.

The estimate uses projectile motion and solves a quadratic equation for the time when the vertical coordinate reaches the ground.

The resulting time is used to predict horizontal landing position.

The agent state becomes based on:

- player horizontal position,
- predicted ball drop position.

This combines a learned policy with an engineered physics feature.

## Epsilon Decay

Q3 also introduces exploration decay.

Its agent starts with a higher exploration probability and multiplies epsilon by a decay factor after updates.

A minimum epsilon prevents exploration from reaching zero.

This changes the policy from fixed exploration to a gradual exploration/exploitation schedule.

## Q4 — Richer Tabular Agent

`q4.py` is the most developed experiment.

It increases state resolution to 20 bins and adjusts core learning parameters.

It keeps the tabular Q-table but adds several additional mechanisms.

### Informed Initialization

The Q-table is preinitialized with a slight preference for middle-range arc values.

New states can also borrow values from nearby existing states.

This is a heuristic initialization strategy.

It is not function approximation.

### Experience Replay

The agent stores transitions in a replay buffer.

The configured buffer size is:

```text
1000 experiences
```

The target batch size is:

```text
32
```

After a direct update, the agent can sample past experiences and replay Q-learning updates.

Experience replay is more commonly associated with deep RL, but here it is applied to a tabular Q-table.

The corpus therefore tags experience replay without implying a DQN.

### Shot History

The final agent records recent:

```text
(action, reward)
```

pairs per state.

It can use historical average reward to prefer an action that has performed well in that state.

This adds a second evidence source to normal Q-value selection.

### Learned Basket-Position Estimate

The agent maintains an estimated basket x-coordinate.

Successful shots contribute predicted-drop samples.

Recent successful samples are averaged to update the estimate.

The state then uses drop position relative to the estimated basket.

This is a small form of online environment parameter estimation.

### Local Exploration

During exploration, the final agent can select an action near the current best arc instead of always sampling the full action range.

This biases exploration toward local action-space neighborhoods.

### Physics Heuristic

`adjust_arc_for_distance` compares predicted drop against estimated basket position.

If shots undershoot, it can suggest a larger arc.

If shots overshoot, it can suggest a smaller arc.

This creates a hybrid policy design containing:

- tabular learned values,
- recorded empirical shot outcomes,
- a physics-informed heuristic.

## Reward Design

The early Q-learning implementation uses:

- positive reward for a basket,
- negative reward for a miss.

This is simple reward shaping.

The reward is directly tied to task completion.

The project does not create a complex multi-objective reward function.

That simplicity makes the learning behavior easier to interpret.

## State Representation as an Engineering Variable

One of the strongest aspects of this repository is that state design evolves explicitly.

The progression is:

```text
player position
→ player position + final landing position
→ player position + predicted drop position
→ player position + drop relative to learned basket estimate
```

This is valuable evidence of thinking about observability and state sufficiency.

It demonstrates that RL design is not only about changing alpha or gamma.

It is also about deciding what the agent can observe.

## Exploration Strategy Evolution

The progression also changes exploration:

```text
fixed epsilon
→ epsilon decay
→ decayed epsilon with local exploration and shot-history preference
```

Again, this is a concrete experimental axis.

## Experience Replay Boundary

The presence of a replay buffer should not be confused with deep reinforcement learning.

There is no neural network approximator in the checked-in source.

The agent still stores explicit Q-values keyed by discrete state.

The correct description is:

- tabular Q-learning,
- with experience replay.

## Testing and Verification

Verification is interactive and simulation-driven.

The game itself provides immediate observable feedback:

- projectile trajectory,
- basket collision,
- score,
- miss penalties,
- agent-generated shots.

The successive files act as experimental variants.

There is no separate experiment-report artifact showing convergence curves or controlled multi-seed evaluation.

Therefore the strongest claim is implementation and experimentation with RL mechanisms, not demonstrated convergence superiority.

## Engineering Discipline

The repository demonstrates disciplined comparative iteration.

Rather than overwriting one file repeatedly, it preserves:

- baseline,
- Q1,
- Q2,
- Q3,
- Q4.

That makes design evolution inspectable.

Each version changes a meaningful variable:

- state,
- prediction,
- exploration,
- replay,
- heuristics.

This is useful engineering provenance.

## Scale and Complexity

The codebase is small in file count but substantial in behavior.

`q4.py` is roughly 25 KB and combines:

- a real-time game,
- physics,
- agent state,
- a Q-table,
- replay memory,
- exploration logic,
- online estimates,
- user interaction,
- rendering.

Its complexity comes from the coupling between learning and an interactive environment.

## Skills Demonstrated

Directly supported skills include:

- reinforcement learning,
- tabular Q-learning,
- Q-value updates,
- epsilon-greedy exploration,
- epsilon decay,
- state discretization,
- action-space design,
- reward shaping,
- experience replay,
- online learning,
- simulation-based learning,
- physics-informed features,
- projectile-motion modeling,
- Python,
- Pygame,
- event-driven game loops,
- object-oriented game structure.

## Capability Developed

The repository demonstrates the ability to build an environment and then progressively design an agent around it.

That includes:

- defining state,
- defining action space,
- defining reward,
- integrating agent actions into simulation,
- collecting outcomes,
- updating policy values online,
- changing state representation based on observed limitations,
- adding exploration scheduling,
- adding replay and heuristic knowledge.

This is more meaningful than calling a prebuilt RL environment.

The environment and control loop are both visible in the source.

## Portfolio Evolution Context

Earlier portfolio work already contains game programming and machine-learning exercises.

This repository combines those threads.

It takes:

- Pygame-style interactive simulation,
- explicit physics,
- ML experimentation,

and turns them into a reinforcement-learning control task.

That makes it a clear convergence project.

## Historical Significance

Within the processed corpus, this is the earliest direct implementation evidence of:

- reinforcement learning,
- Q-learning,
- epsilon-greedy control,
- experience replay,
- Pygame.

It is also an early example of using physics knowledge to engineer an RL state and heuristic.

## Evidence Boundaries

The repository does not implement deep Q-learning.

No neural policy/value network is present.

Experience replay is used with a tabular learner.

The code demonstrates RL mechanism design, but the repository does not contain a controlled convergence study that would justify comparative performance claims between Q1–Q4.

## Overall Narrative

`Reinforcement-Learning` is a short but technically rich experiment series.

It starts with a custom basketball physics game and progressively teaches a tabular Q-learning agent to choose shot arcs.

The sequence preserves how the state and learning strategy evolve:

```text
baseline game
→ tabular Q-learning
→ outcome-aware state
→ physics-predicted state
→ adaptive replay/history/heuristic agent
```

Its strongest portfolio signal is iterative agent design grounded in a personally implemented interactive environment.

# Project Tags

- `individual-project`
- `reinforcement-learning`
- `q-learning`
- `tabular-q-learning`
- `epsilon-greedy`
- `epsilon-decay`
- `state-discretization`
- `action-space-design`
- `reward-shaping`
- `experience-replay`
- `online-learning`
- `simulation-based-learning`
- `physics-informed-learning`
- `projectile-motion`
- `pygame`
- `python`
- `game-simulation`
- `game-physics`
- `real-time-loop`
- `agent-environment-loop`
