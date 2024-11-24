import { Octokit } from '@octokit/rest';

type Repo = {
  owner: string;
  repo: string;
};

type Issue = {
  number: number;
  title: string;
  body: string;
  labels: { name: string }[];
};

const DEFAULT_ISSUES_PER_PAGE = 100;

type ProcessIssuesOptions = Repo & {
  isIgnored: (issue: Issue) => boolean;
  action: (issue: Issue) => Promise<void> | void;
  perPage?: number;
};

export const processIssues = async ({
  owner,
  repo,
  isIgnored,
  action,
  perPage = DEFAULT_ISSUES_PER_PAGE,
}: ProcessIssuesOptions): Promise<void> => {
  const octokit = new Octokit();

  const { data: issues } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    per_page: perPage,
  });

  for (const issue of issues) {
    const issueData: Issue = {
      title: issue.title,
      body: issue.body || '',
      labels: issue.labels as { name: string }[],
      number: issue.number,
    };

    if (isIgnored(issueData)) {
      continue;
    }

    await action(issueData);
  }
};

type FindCommitHashFromIssueBodyOptions = Repo & {
  issueBody: string;
};

export const findCommitHashFromIssueBody = ({
  issueBody,
  owner,
  repo,
}: FindCommitHashFromIssueBodyOptions): string => {
  const regex = new RegExp(
    `https://github.com/${owner}/${repo}/commit/([a-zA-Z0-9]+)`,
  );

  const match = issueBody.match(regex);
  const commitHash = match?.[1];

  if (!commitHash) {
    throw new Error('Commit hash not found');
  }

  return commitHash;
};

type FindTranslationBranchOptions = Repo & {
  isTranslationBranch: (branchName: string) => boolean;
};

export const findTranslationBranch = async ({
  owner,
  repo,
  isTranslationBranch,
}: FindTranslationBranchOptions): Promise<string> => {
  const octokit = new Octokit();
  const { data: branches } = await octokit.rest.repos.listBranches({
    owner,
    repo,
  });

  const translationBranch = branches.find(branch =>
    isTranslationBranch(branch.name),
  )?.name;

  if (!translationBranch) {
    throw new Error('Translation branch not found');
  }

  return translationBranch;
};

type FindTranslationCommitHashOptions = Repo & {
  translationBranchName: string;
  originalCommitHash: string;
  defaultBranchName?: string;
};

export const findTranslationCommitHash = async ({
  translationBranchName,
  originalCommitHash,
  owner,
  repo,
  defaultBranchName = 'main',
}: FindTranslationCommitHashOptions): Promise<string | undefined> => {
  if (translationBranchName === defaultBranchName) {
    return originalCommitHash;
  }

  const octokit = new Octokit();

  const { data: originCommit } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: originalCommitHash,
  });

  if (!originCommit) {
    throw new Error('Origin commit not found');
  }

  const { data: translationCommits } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    sha: translationBranchName,
  });

  const translateCommit = translationCommits.find(
    ({ commit: { message: translateCommitMessage } }) =>
      translateCommitMessage.startsWith(originCommit.message),
  );

  return translateCommit?.sha;
};

type MarkIssueAsTranslatedOptions = Repo & {
  issueNumber: number;
  translationCommitHash: string;
  labelName: string;
  token: string;
};

export const markIssueAsTranslated = async ({
  owner,
  repo,
  issueNumber,
  translationCommitHash,
  labelName,
  token,
}: MarkIssueAsTranslatedOptions): Promise<void> => {
  const octokit = new Octokit({ auth: token });

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: `Translation commit hash: ${translationCommitHash}`,
  });

  await octokit.rest.issues.removeLabel({
    owner,
    repo,
    issue_number: issueNumber,
    name: labelName,
  });
};
