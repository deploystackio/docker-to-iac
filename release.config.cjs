module.exports = {
  branches: [
    "main",
    { name: "next", prerelease: true },
    { name: "release/*", prerelease: false }
  ],
  plugins: [
    ["@semantic-release/commit-analyzer", {
      "releaseRules": [
        { "type": "feat", "release": "minor" },
        { "type": "fix", "release": "patch" },
        { "type": "docs", "release": "patch" },
        { "type": "chore", "release": "patch" },
        { "type": "refactor", "release": "patch" },
        { "type": "test", "release": "patch" }
      ]
    }],
    "@semantic-release/release-notes-generator",
    ["@semantic-release/npm", {
      "pkgRoot": "."
    }],
    ["@semantic-release/github", {
      "assets": ["dist/**"],
      "successComment": false,
      "failComment": false
    }],
    ["@semantic-release/git", {
      "assets": ["package.json", "package-lock.json"],
      "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
    }]
  ],
  tagFormat: "v${version}",
  ci: true,
  debug: true
}
