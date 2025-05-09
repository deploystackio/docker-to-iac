module.exports = {
  "git": {
    "commitMessage": "chore(release): release v${version}",
    "tagName": "v${version}",
    "tagAnnotation": "Release ${version}",
    "addUntrackedFiles": false
  },
  "github": {
    "release": true,
    "releaseName": "v${version}"
  },
  "npm": {
    "publish": true,
    "skipChecks": true
  },
  "hooks": {
    "before:init": ["npm run lint"],
    "after:bump": "npm run build",
    "after:release": "echo 'Released ${version}!'"
  },
  "plugins": {
    "@release-it/conventional-changelog": {
      "preset": {
        "name": "angular",
        "types": [
          { "type": "feat", "section": "Features" },
          { "type": "fix", "section": "Bug Fixes" },
          { "type": "chore", "section": "Chores" },
          { "type": "docs", "section": "Documentation" },
          { "type": "style", "section": "Styles" },
          { "type": "refactor", "section": "Code Refactoring" },
          { "type": "perf", "section": "Performance Improvements" },
          { "type": "test", "section": "Tests" }
        ]
      },
      "infile": "CHANGELOG.md",
      "ignoreRecommendedBump": true,
      "header": "# Changelog\n",
      "headerFormat": "## [{version}]"
    }
  }
};
