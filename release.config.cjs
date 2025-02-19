module.exports = {
  branches: [
    { name: "main" },
    { name: "next", prerelease: true },
    { name: "release/*", channel: "release/${name.replace(/^release\\//g, '')}" }
  ],
  plugins: [
    "@semantic-release/commit-analyzer",
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
  ]
}
