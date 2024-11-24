import { expect, test, describe, jest } from 'bun:test';
import {
  findCommitHashFromIssueBody,
  findTranslationBranch,
  findTranslationCommitHash,
  markIssueAsTranslated,
  processIssues,
} from '.';

const OWNER = 'Gumball12';
const REPO = 'commit-mirror';
const ORIGINAL_COMMIT_HASH = '68895092db80a0c8e335f75d6fa2f1073ad6c4dd';
const TRANSLATION_BRANCH_NAME = 'for-test';
const TRANSLATION_COMMIT_HASH = '6863f101fdd1f336f9bb01901a632d1e0a9c4db3';

describe('processIssues', () => {
  test('Iterate Issues', async () => {
    const fn = jest.fn();
    let count = 0;

    await processIssues({
      action: fn,
      isIgnored: () => {
        count++;
        return false;
      },
      owner: OWNER,
      repo: REPO,
      perPage: 10,
    });

    expect(fn).toHaveBeenCalledTimes(count);
  });

  test('Ignore Issues', async () => {
    const fn = jest.fn();

    await processIssues({
      action: fn,
      isIgnored: () => true,
      owner: OWNER,
      repo: REPO,
      perPage: 10,
    });

    expect(fn).not.toHaveBeenCalled();
  });
});

describe('findCommitHashFromIssueBody', () => {
  test('Find Commit Hash Success', () => {
    const commit = 'my1commit2hash3';
    const hash = findCommitHashFromIssueBody({
      issueBody: `New updates on head repo.
        https://github.com/${OWNER}/${REPO}/commit/${commit}`,
      owner: OWNER,
      repo: REPO,
    });

    expect(hash).toBe(commit);
  });

  test('Find Commit Hash Failure', () => {
    expect(() =>
      findCommitHashFromIssueBody({
        issueBody: 'New updates on head repo.',
        owner: OWNER,
        repo: REPO,
      }),
    ).toThrow();
  });
});

describe('findTranslationBranch', () => {
  test('Find Translation Branch Success', async () => {
    const branchName = await findTranslationBranch({
      isTranslationBranch: name => name === TRANSLATION_BRANCH_NAME,
      owner: OWNER,
      repo: REPO,
    });

    expect(branchName).toBe(TRANSLATION_BRANCH_NAME);
  });

  test('Find Translation Branch Failure', () => {
    expect(
      findTranslationBranch({
        isTranslationBranch: () => false,
        owner: OWNER,
        repo: REPO,
      }),
    ).rejects.toThrow();
  });
});

describe('findTranslationCommitHash', () => {
  test('Find Translation Commit Hash Success', async () => {
    const hash = await findTranslationCommitHash({
      translationBranchName: TRANSLATION_BRANCH_NAME,
      originalCommitHash: ORIGINAL_COMMIT_HASH,
      owner: OWNER,
      repo: REPO,
    });

    expect(hash).toBe(TRANSLATION_COMMIT_HASH);
  });

  test('Return Original Commit Hash', async () => {
    const hash = await findTranslationCommitHash({
      translationBranchName: TRANSLATION_BRANCH_NAME,
      defaultBranchName: TRANSLATION_BRANCH_NAME,
      originalCommitHash: ORIGINAL_COMMIT_HASH,
      owner: OWNER,
      repo: REPO,
    });

    expect(hash).toBe(ORIGINAL_COMMIT_HASH);
  });

  test('Find Translation Commit Hash Failure', () => {
    expect(
      findTranslationCommitHash({
        translationBranchName: TRANSLATION_BRANCH_NAME,
        originalCommitHash: 'not-found-commit-hash',
        owner: OWNER,
        repo: REPO,
      }),
    ).rejects.toThrow();
  });
});

const TOKEN = Bun.env.GITHUB_TOKEN;
const SKIP_E2E_TESTS = Bun.env.SKIP_E2E_TESTS;

describe.skipIf(TOKEN === undefined || SKIP_E2E_TESTS === 'true')('app', () => {
  test('App Test with Issue Processing', async () => {
    const owner = 'Gumball12';
    const repo = 'commit-mirror';

    const translationBranch = await findTranslationBranch({
      owner,
      repo,
      isTranslationBranch: (branchName: string) =>
        branchName.startsWith('for-test'),
    });

    await processIssues({
      owner,
      repo,
      isIgnored: issue => issue.labels.every(label => label.name !== 'test'),
      action: async issue => {
        const originCommitHash = findCommitHashFromIssueBody({
          issueBody: issue.body,
          owner,
          repo,
        });

        const translationCommitHash = await findTranslationCommitHash({
          translationBranchName: translationBranch,
          originalCommitHash: originCommitHash,
          owner,
          repo,
        });

        if (!translationCommitHash) {
          return;
        }

        await markIssueAsTranslated({
          owner,
          repo,
          issueNumber: issue.number,
          translationCommitHash,
          labelName: 'test',
          token: TOKEN!,
        });
      },
    });
  });
});
