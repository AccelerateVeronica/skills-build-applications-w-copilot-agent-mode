import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

function normalizeFocus(value: string) {
  const normalized = value.trim().toLowerCase();
  if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking', 'cardio'].includes(normalized)) return 'endurance';
  return normalized;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw httpError(400, 'Activity details are required');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (!isObjectId(userId) || !isObjectId(teamId)) throw httpError(400, 'Valid userId and teamId are required');
  if (typeof type !== 'string' || type.trim().length === 0) throw httpError(400, 'Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'Activity minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id').lean(),
    Team.findById(teamId).select('_id').lean(),
  ]);
  if (!user || !team) throw httpError(404, 'Activity user or team was not found');

  return Activity.create({ user: userId, team: teamId, type: type.trim(), minutes, points: minutes, occurredAt: new Date() });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw httpError(400, 'Team details are required');

  const { name, mascot } = input as Record<string, unknown>;
  const rawMembers = (input as Record<string, unknown>).members;
  if (typeof name !== 'string' || name.trim().length === 0) throw httpError(400, 'Team name is required');
  if (typeof mascot !== 'string' || mascot.trim().length === 0) throw httpError(400, 'Team mascot is required');

  const members = rawMembers === undefined ? [] : rawMembers;
  if (!Array.isArray(members) || !members.every(isObjectId)) throw httpError(400, 'Team members must be valid user IDs');

  const uniqueMembers = [...new Set(members)];
  if (uniqueMembers.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: uniqueMembers } });
    if (existingMembers !== uniqueMembers.length) throw httpError(404, 'One or more team members were not found');
  }

  return Team.create({ name, mascot, members: uniqueMembers });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate([{ $group: { _id: '$team', totalPoints: { $sum: '$points' } } }]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));

  return teams
    .map(({ _id, name }) => ({ teamName: name, totalPoints: pointsByTeam.get(_id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError(404, 'User was not found');

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).select('type').lean(),
    Workout.find().lean(),
  ]);
  const goalFocus = normalizeFocus(user.fitnessGoal);
  const activityFocuses = activities.map(({ type }) => ({ type, focus: normalizeFocus(type) }));
  const preferredFocuses = [...new Set([goalFocus, ...activityFocuses.map(({ focus }) => focus)])];
  const matchingFocus = preferredFocuses.find((focus) => workouts.some((workout) => normalizeFocus(workout.focus) === focus));
  if (!matchingFocus) return [];

  return workouts
    .map((workout) => {
      const focus = normalizeFocus(workout.focus);
      const matchingActivity = activityFocuses.find((activity) => activity.focus === focus);
      const matchPriority = preferredFocuses.indexOf(focus);
      const reason = focus === goalFocus
        ? `Matches your ${user.fitnessGoal} fitness goal${matchingActivity ? ` and recent ${matchingActivity.type} activity` : ''}.`
        : matchingActivity
          ? `Recommended based on your recent ${matchingActivity.type} activity.`
          : `Complements your ${user.fitnessGoal} fitness goal.`;
      return { workout, reason, priority: matchPriority < 0 ? preferredFocuses.length : matchPriority };
    })
    .sort((left, right) => left.priority - right.priority)
    .map(({ workout, reason }) => ({ ...workout, reason }));
}

export { User };
