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
    // Add this line to skip authentication check during PR creation
    "skipChecks": true
  },
  "hooks": {
    "before:init": ["npm run lint"],
    "after:bump": "npm run build",
    "after:release": "echo 'Released ${version}!'"
  },
  "plugins": {
    "@release-it/conventional-changelog": {
      "preset": "angular",
      "infile": "CHANGELOG.md",
      "ignoreRecommendedBump": true
    }
  }
};
