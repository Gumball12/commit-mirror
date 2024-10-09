import { Octokit } from '@octokit/rest';

type Release = {
  id: number;
  tag_name: string;
  name: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  url: string;
};

const TARGET_TAG_NAME = 'v1.2.0';

// 1. 번역 원본 커밋 hash 가져옴 & `git show <hash> | patch-id`
// 1.1. 해당 hash로 pre-release 아니고, v로 시작하는 릴리즈에 포함되었는지 가져올 수 있나? (main에서 배포 시 처리를 위함)
// 2. 버전 높은 이름 갖는 branch부터 차례대로 `git rev-list <hash>_<branch> | xargs git show | git patch-id`
// 3. 나오는 값 중 1 결과와 동일하다? 그럼 `git tag --contains <3_hash>`로 tags 가져오고
// 4. 나오는 tags 중 pre-release 아니고 `v` 시작하는 버전 중 가장 높은 버전 선택
const getReleases = async (owner: string, repo: string): Promise<Release[]> => {
  const octokit = new Octokit();

  const { data: branches } = await octokit.rest.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  });
  console.log(
    branches
      .filter(({ name }) => name.startsWith('v'))
      .filter(({ name }) => !name.includes('/'))
      .filter(({ name }) => !name.includes('.'))
      .map(({ name }) => name),
  );

  const releases = (
    await octokit.rest.repos.listReleases({
      owner,
      repo,
    })
  ).data.reverse();

  console.log(
    releases
      .filter(({ prerelease }) => !prerelease)
      .filter(({ tag_name: tagName }) => tagName.startsWith('v'))
      .map(({ tag_name: tagName }) => tagName),
  );

  /*
  const currentReleaseIndex = releases.findIndex(
    release => release.tag_name === TARGET_TAG_NAME,
  );

  if (currentReleaseIndex < 0) {
    console.error('invalid tag name');
    return;
  }

  const prevRelease = releases[currentReleaseIndex - 1];

  const { data: commits } = await octokit.rest.repos.compareCommits({
    owner,
    repo,
    base: prevRelease.tag_name,
    head: TARGET_TAG_NAME,
  });

  console.log(commits.commits.map(({ commit }) => commit.message));
  */
};

getReleases('vitejs', 'vite');
