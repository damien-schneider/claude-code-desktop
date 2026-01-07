Ralph Prompt Wizard - Generate a perfect Ralph loop command.

Ask the user these questions:
1. What task should Claude work on iteratively?
2. What is the completion promise phrase? (default: TASK_COMPLETE)
3. What is the max iterations? (default: 20, press Enter to accept default)

Then output ONLY a single line in this exact format:

/ralph-wiggum:ralph-loop "<PROMPT>" --completion-promise "<PROMISE>" --max-iterations <N>

Example output:
/ralph-wiggum:ralph-loop "Refactor auth.ts to use JWT. Tests must pass. Output <promise>JWT_AUTH_COMPLETE</promise>" --completion-promise "JWT_AUTH_COMPLETE" --max-iterations 15
