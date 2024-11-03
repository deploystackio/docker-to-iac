interface DockerImageInfo {
  repository: string;
  tag: string;
}

export const parseDockerImage = (imageString: string): DockerImageInfo => {
  if (typeof imageString !== 'string') {
    throw new Error('Docker image must be a string');
  }

  if (!imageString.trim()) {
    throw new Error('Docker image string cannot be empty');
  }

  // Default values
  let repository = '';
  let tag = 'latest';

  // Remove any whitespace
  const cleanImageString = imageString.trim();

  // Handle SHA256 digest format
  if (cleanImageString.includes('@sha256:')) {
    const [imagePart, digest] = cleanImageString.split('@sha256:');
    tag = `sha256:${digest}`;
    repository = imagePart;
  } else {
    // Handle standard tag format
    const [imagePart, tagPart] = cleanImageString.split(':');
    repository = imagePart;
    if (tagPart) {
      tag = tagPart;
    }
  }

  // Handle private repository format (e.g., repository.example.com/image)
  const repositoryParts = repository.split('/');
  repository = repositoryParts[repositoryParts.length - 1];

  return {
    repository,
    tag
  };
};
