import { DockerImageInfo } from '../parsers/base-parser';

export function constructImageString(image: DockerImageInfo): string {
  const { registry, repository, tag, digest } = image;
  let imageStr = '';

  if (registry) {
    imageStr += `${registry}/`;
  }

  imageStr += repository;

  if (tag) {
    imageStr += `:${tag}`;
  }

  if (digest) {
    imageStr += `@${digest}`;
  }

  return imageStr;
}
