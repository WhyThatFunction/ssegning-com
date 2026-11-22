import { factories } from '@strapi/strapi';

import { publishedOnly } from '../../../utils/published-only';

export default factories.createCoreService('api::post.post', publishedOnly);
