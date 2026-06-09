import { defineCommand, runMain } from "citty";
import { loginCommand } from "./commands/auth/login.js";
import { logoutCommand } from "./commands/auth/logout.js";
import { whoamiCommand } from "./commands/auth/whoami.js";
import { configCommand } from "./commands/config.js";
import { projectsCommand } from "./commands/projects/index.js";
import {
  createEpicsCommand,
  createUserStoriesCommand,
  createWorkItemCommands,
} from "./commands/shared/work-item-commands.js";
import { milestonesCommand } from "./commands/milestones/index.js";
import { membersCommand } from "./commands/members/index.js";
import { usersCommand } from "./commands/users/index.js";
import { attachmentsCommand } from "./commands/attachments/index.js";
import { commentsCommand } from "./commands/comments/index.js";
import { tagsCommand } from "./commands/tags/index.js";
import { metadataCommand } from "./commands/metadata/index.js";
import { wikiCommand } from "./commands/wiki/index.js";
import { webhooksCommand } from "./commands/webhooks/index.js";
import { searchCommand } from "./commands/search.js";
import { globalArgs } from "./lib/flags.js";

export const main = defineCommand({
  meta: {
    name: "taiga",
    description: "CLI for Taiga project management",
    version: "0.1.0",
  },
  args: globalArgs,
  subCommands: {
    login: loginCommand,
    logout: logoutCommand,
    whoami: whoamiCommand,
    config: configCommand,
    projects: projectsCommand,
    "user-stories": createUserStoriesCommand(),
    tasks: createWorkItemCommands({ name: "tasks", type: "task", statusKind: "task" }),
    issues: createWorkItemCommands({ name: "issues", type: "issue", statusKind: "issue" }),
    epics: createEpicsCommand(),
    milestones: milestonesCommand,
    members: membersCommand,
    users: usersCommand,
    attachments: attachmentsCommand,
    comments: commentsCommand,
    tags: tagsCommand,
    metadata: metadataCommand,
    wiki: wikiCommand,
    webhooks: webhooksCommand,
    search: searchCommand,
  },
});

runMain(main);
