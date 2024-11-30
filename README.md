# commit-mirror

간혹 어떤 한 브랜치에 존재하는 커밋을 다른 브랜치에도 존재하는지 확인이 필요한 경우가 있습니다. 가령 번역 작업을 진행하는 경우, 원본 브랜치에 존재하는 커밋이 번역 브랜치에도 존재하는지 확인이 필요한 경우가 있습니다. 이러한 경우 사용할 수 있습니다.

## Usage

## Example

## Contributing

이 프로젝트는 [Bun](https://bun.sh) v1.1.30으로 개발되었습니다.

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash
```

기여를 위해 이 리포지토리를 클론합니다.

```bash
git clone https://github.com/Gumball12/commit-mirror.git
```

그리고 아래 명령어를 통해 의존성을 설치하거나, 테스트를 수행할 수 있습니다.

```bash
# Install dependencies
bun install

# Run tests
bun test
```

### Run tests with environment variables

일부 테스트는 환경 변수를 필요로 합니다. 이러한 테스트는 `skipIf` 메서드를 이용해, 실행하기 어려운 상황이라면 자동으로 건너뛰도록 구성되어 있습니다. 필요한 경우 테스트를 수행하기 전 `.env` 파일을 통해 환경 변수를 설정해주세요.

```env
# .env
GITHUB_TOKEN=your_github_pat_token

...
```

`.env` 파일 생성 후, 추가적인 설정 없이 바로 환경 변수를 사용할 수 있습니다(`Bun.env.<NAME>`으로 접근 가능).

## License

[MIT](./LICENSE)
